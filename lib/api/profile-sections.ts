import { supabase } from '@/supabase/utils';
import { v4 as uuidv4 } from 'uuid';

export interface ProfileSection {
  id: string;
  profile_id: string;
  title: string;
  section_key: string;
  display_order?: number;
  section_order?: number; // For backward compatibility during migration
  fields?: ProfileSectionField[];
}

export interface ProfileSectionField {
  id: string;
  section_id: string;
  field_key: string;
  field_label: string;
  field_value: string;
  field_type: string;
  display_order: number;
}

export interface NewProfileSection {
  title: string;
  section_key?: string;
  display_order?: number;
  fields?: NewProfileSectionField[];
}

export interface NewProfileSectionField {
  field_key: string;
  field_label: string;
  field_value: string;
  field_type: string;
  display_order?: number;
}

/**
 * Fetch all profile sections for a given profile
 */
export async function getProfileSections(profileId: string) {
  try {
    const { data: sections, error } = await supabase
      .from('profile_sections')
      .select('*')
      .eq('profile_id', profileId)
      .order('display_order', { ascending: true });

    if (error) throw error;
    
    return { sections, error: null };
  } catch (error) {
    console.error('Error fetching profile sections:', error);
    return { sections: null, error };
  }
}

/**
 * Fetch a single profile section with its fields
 */
export async function getProfileSectionWithFields(sectionId: string) {
  try {
    // Fetch the section
    const { data: section, error: sectionError } = await supabase
      .from('profile_sections')
      .select('*')
      .eq('id', sectionId)
      .single();

    if (sectionError) throw sectionError;

    // Fetch the fields for this section
    const { data: fields, error: fieldsError } = await supabase
      .from('profile_section_fields')
      .select('*')
      .eq('section_id', sectionId)
      .order('display_order', { ascending: true });

    if (fieldsError) throw fieldsError;

    return { 
      section: { ...section, fields }, 
      error: null 
    };
  } catch (error) {
    console.error('Error fetching profile section with fields:', error);
    return { section: null, error };
  }
}

/**
 * Fetch all profile sections with their fields
 */
export async function getProfileSectionsWithFields(profileId: string) {
  try {
    // Use display_order as the standard column name for ordering
    const orderColumn = 'display_order';
    
    // Get all sections ordered by display_order
    const { data: sections, error } = await supabase
      .from('profile_sections')
      .select('*')
      .eq('profile_id', profileId)
      .order(orderColumn, { ascending: true });
    
    if (error) throw error;
    
    if (!sections || sections.length === 0) {
      return { sections: [], error: null };
    }
    
    // Then get all fields for these sections
    const sectionIds = sections.map(section => section.id);
    const { data: fields, error: fieldsError } = await supabase
      .from('profile_section_fields')
      .select('*')
      .in('section_id', sectionIds)
      .order('display_order', { ascending: true });
    
    if (fieldsError) throw fieldsError;
    
    
    // Combine sections with their fields
    const sectionsWithFields = sections.map(section => {
      console.log(section)
      // Get fields for this section
      const sectionFields = fields?.filter(field => field.section_id === section.id) || [];
      
      console.log(`Section ${section.title} has ${sectionFields.length} fields`);
      
      // Structure section in the expected format for the frontend
      return {
        section_id: section.id,
        section_key: section.section_key,
        title: section.title,
        fields: sectionFields.map(field => ({
          field_id: field.id,
          field_key: field.field_key,
          field_label: field.field_label,
          field_value: field.field_value !== undefined ? field.field_value : '',
          field_type: field.field_type
        }))
      };
    });
    
    return { sections: sectionsWithFields, error: null };
  } catch (error) {
    console.error('Error fetching profile sections with fields:', error);
    return { sections: [], error };
  }
}

/**
 * Create a new profile section with optional fields
 */
export async function createProfileSection(profileId: string, sectionData: NewProfileSection) {
  try {
    // Generate a section_key if not provided
    const section_key = sectionData.section_key || 
      sectionData.title.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    
    // Get the highest display_order and add 1
    const { data: highestOrder } = await supabase
      .from('profile_sections')
      .select('display_order')
      .eq('profile_id', profileId)
      .order('display_order', { ascending: false })
      .limit(1);
    
    const nextOrder = highestOrder && highestOrder.length > 0 && highestOrder[0].display_order !== null
      ? highestOrder[0].display_order + 1 
      : 0;
    
    // Use provided display_order or the next available order
    const displayOrder = sectionData.display_order !== undefined 
      ? sectionData.display_order 
      : nextOrder;
    
    // Create the section with display_order
    const sectionToInsert = {
      profile_id: profileId,
      title: sectionData.title,
      section_key,
      section_name: sectionData.title, // Add section_name which is required
      display_order: displayOrder
    };
    
    const { data: section, error: sectionError } = await supabase
      .from('profile_sections')
      .insert(sectionToInsert)
      .select()
      .single();
    
    if (sectionError) throw sectionError;
    
    // If fields are provided, create them
    if (sectionData.fields && sectionData.fields.length > 0) {
      const fieldsToInsert = sectionData.fields.map((field, index) => ({
        section_id: section.id,
        field_key: field.field_key,
        field_label: field.field_label,
        field_value: field.field_value || '',
        field_type: field.field_type || 'text',
        display_order: field.display_order !== undefined ? field.display_order : index
      }));
      
      const { data: fields, error: fieldsError } = await supabase
        .from('profile_section_fields')
        .insert(fieldsToInsert)
        .select();
      
      if (fieldsError) throw fieldsError;
      
      return { section: { ...section, fields }, error: null };
    }
    
    return { section, error: null };
  } catch (error) {
    console.error('Error creating profile section:', error);
    return { section: null, error };
  }
}

/**
 * Update an existing profile section and its fields
 */
export async function updateProfileSection(sectionId: string, sectionData: Partial<ProfileSection>, fields?: Partial<ProfileSectionField>[]) {
  try {
    console.log('============= START SECTION UPDATE =============');
    console.log(`Updating section: ${sectionId} with title: ${sectionData.title}`);
    
    // Update the section
    const { data: section, error: sectionError } = await supabase
      .from('profile_sections')
      .update({
        title: sectionData.title,
        section_key: sectionData.section_key,
        display_order: sectionData.display_order
      })
      .eq('id', sectionId)
      .select()
      .single();
    
    if (sectionError) throw sectionError;
    
    // If fields are provided, handle field updates and inserts
    if (fields && fields.length > 0) {
      console.log('------------- FIELD PROCESSING -------------');
      console.log(`Processing ${fields.length} fields for section ${sectionId}`);
      
      // IMPORTANT: First, get ALL existing fields for this section
      const { data: existingFields, error: fieldsError } = await supabase
        .from('profile_section_fields')
        .select('*')  // Get all field data for better mapping
        .eq('section_id', sectionId);
      
      if (fieldsError) {
        console.error('Error fetching existing fields:', fieldsError);
        throw fieldsError;
      }
      
      // Create a map of existing fields by ID for easier lookup
      const existingFieldsMap: Record<string, any> = {};
      existingFields?.forEach(field => {
        if (field && field.id) {
          existingFieldsMap[field.id] = field;
        }
      });
      
      // Also create a map by field_key to handle field matching by key when ID is missing
      const existingFieldsByKey: Record<string, any> = {};
      existingFields?.forEach(field => {
        if (field && field.field_key) {
          existingFieldsByKey[field.field_key] = field;
        }
      });
      
      console.log('Existing fields map:', existingFieldsMap);
      console.log('Existing fields by key:', existingFieldsByKey);
      
      // Track which existing fields have been processed
      const processedExistingFieldIds = new Set();
      
      // More sophisticated field mapping strategy
      // 1. If field has an ID and that ID exists in existing fields -> UPDATE
      // 2. If field has no ID but has a field_key that matches an existing field -> UPDATE using that field's ID
      // 3. Otherwise -> INSERT new field
      
      // Process each field from the input
      const fieldsToUpdate = [];
      const fieldsToInsert = [];
      
      for (const field of fields) {
        // Case 1: Field has an ID that exists in the database
        if (field.id && existingFieldsMap[field.id]) {
          console.log(`Field has existing ID: ${field.id}, Label: ${field.field_label}, will UPDATE`);
          fieldsToUpdate.push({
            ...field,
            id: field.id  // Ensure ID is preserved
          });
          processedExistingFieldIds.add(field.id);
        }
        // Case 2: Field has no ID but has a matching field_key
        else if (field.field_key && 
                existingFieldsByKey[field.field_key] && 
                existingFieldsByKey[field.field_key].id && 
                !processedExistingFieldIds.has(existingFieldsByKey[field.field_key].id)) {
          const existingField = existingFieldsByKey[field.field_key];
          console.log(`Field matched by key: "${field.field_key}" -> ID: ${existingField.id}, will UPDATE`);
          fieldsToUpdate.push({
            ...field,
            id: existingField.id  // Use the ID from the existing field
          });
          processedExistingFieldIds.add(existingField.id);
        }
        // Case 3: It's a new field
        else {
          console.log(`Field is new: "${field.field_label}" (key: ${field.field_key}), will INSERT`);
          fieldsToInsert.push(field); // No ID needed as this is a new field
        }
      }
      
      // STEP 1: Update existing fields
      if (fieldsToUpdate.length > 0) {
        console.log(`Updating ${fieldsToUpdate.length} existing fields for section ${sectionId}`);
        
        // Process updates one by one to catch any individual errors
        for (const field of fieldsToUpdate) {
          if (!field.id) {
            console.error('Field in update list has no ID!', field);
            continue;
          }
          
          console.log(`----- Updating field ID: ${field.id} -----`);
          console.log(`Field: ${field.field_label}, Value: "${field.field_value}", Type: ${field.field_type}`);
          
          // Create a clean update payload
          const updateData = {
            field_key: field.field_key,
            field_label: field.field_label,
            field_value: field.field_value !== undefined ? field.field_value : '',
            field_type: field.field_type || 'text',
            display_order: field.display_order !== undefined ? field.display_order : 0
          };
          
          try {
            const { data, error } = await supabase
              .from('profile_section_fields')
              .update(updateData)
              .eq('id', field.id)
              .select();
              
            if (error) {
              console.error(`Error updating field ${field.id}:`, error);
            } else {
              console.log(`Successfully updated field ${field.id}`);
            }
          } catch (err) {
            console.error(`Exception updating field ${field.id}:`, err);
          }
        }
      }
      
      // STEP 2: Insert new fields
      if (fieldsToInsert.length > 0) {
        console.log(`Inserting ${fieldsToInsert.length} new fields for section ${sectionId}`);
        
        // Prepare the data for all new fields
        const newFields = fieldsToInsert.map(field => {
          // Generate field_key from label if not provided
          const fieldKey = field.field_key || 
            (field.field_label ? field.field_label.toLowerCase().replace(/\s+/g, '_') : uuidv4());
            
          // Prepare the field object with all required properties
          return {
            section_id: sectionId,
            field_key: fieldKey,
            field_label: field.field_label || 'Untitled Field',
            field_value: field.field_value !== undefined ? field.field_value : '',
            field_type: field.field_type || 'text',
            display_order: field.display_order !== undefined ? field.display_order : 0
          };
        });
        
        // Log each field we're going to insert
        newFields.forEach((field, i) => {
          console.log(`New field ${i+1}: Key=${field.field_key}, Label=${field.field_label}, Value="${field.field_value}"`);
        });
        
        try {
          const { data, error } = await supabase
            .from('profile_section_fields')
            .insert(newFields)
            .select();
            
          if (error) {
            console.error('Error inserting new fields:', error);
            throw error;
          } else {
            console.log(`Successfully inserted ${data?.length || 0} new fields`);
            data?.forEach(newField => {
              console.log(`New field created: ID=${newField.id}, Label=${newField.field_label}`);
            });
          }
        } catch (err) {
          console.error('Exception inserting new fields:', err);
          throw err;
        }
      }
      
      // Final log for debugging
      console.log('============= END SECTION UPDATE =============');
    }
    
    // Get the updated section with fields
    const { section: updatedSection } = await getProfileSectionWithFields(sectionId);
    
    return { section: updatedSection, error: null };
  } catch (error) {
    console.error('Error updating profile section:', error);
    return { section: null, error };
  }
}

/**
 * Get section IDs for a profile
 * This is useful for directly accessing sections by ID
 */
export async function getProfileSectionIds(profileId: string) {
  try {
    const { data: sections, error } = await supabase
      .from('profile_sections')
      .select('id, section_key, title')
      .eq('profile_id', profileId);
    
    if (error) throw error;
    
    return { sections, error: null };
  } catch (error) {
    console.error('Error fetching profile section IDs:', error);
    return { sections: null, error };
  }
}

/**
 * Delete a profile section and all its fields
 */
export async function deleteProfileSection(sectionId: string | undefined) {
  try {
    // Validate the section ID
    if (!sectionId) {
      console.error('Cannot delete section: No section ID provided');
      return { success: false, error: new Error('Missing section ID') };
    }
    
    console.log('Deleting profile section with ID:', sectionId);
    
    // Check if the section exists first
    const { data: existingSection, error: checkError } = await supabase
      .from('profile_sections')
      .select('id')
      .eq('id', sectionId)
      .single();
    
    if (checkError || !existingSection) {
      console.error(`Section with ID ${sectionId} not found:`, checkError);
      return { success: false, error: checkError || new Error(`Section with ID ${sectionId} not found`) };
    }
    
    // The fields will be automatically deleted due to the ON DELETE CASCADE constraint
    const { data, error } = await supabase
      .from('profile_sections')
      .delete()
      .eq('id', sectionId);
    
    if (error) {
      console.error('Error during section deletion:', error);
      throw error;
    }
    
    console.log('Successfully deleted section and its fields');
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting profile section:', error);
    return { success: false, error };
  }
}

/**
 * Delete a specific field from a profile section
 */
export async function deleteProfileSectionField(fieldId: string) {
  try {
    const { data, error } = await supabase
      .from('profile_section_fields')
      .delete()
      .eq('id', fieldId);
    
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting profile section field:', error);
    return { success: false, error };
  }
}

/**
 * Reorder profile sections
 * 
 * This function updates the display_order of sections in the profile_sections table
 * to control the order in which sections appear on a profile
 */
export async function reorderProfileSections(profileId: string, sectionIds: string[]) {
  try {
    // Update each section's display_order based on its position in the array
    for (let i = 0; i < sectionIds.length; i++) {
      const { error } = await supabase
        .from('profile_sections')
        .update({ display_order: i })
        .eq('id', sectionIds[i])
        .eq('profile_id', profileId);
      
      if (error) throw error;
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error reordering profile sections:', error);
    return { success: false, error };
  }
}

/**
 * Reorder fields within a profile section
 */
export async function reorderProfileSectionFields(sectionId: string, fieldIds: string[]) {
  try {
    // Update each field's display_order based on its position in the array
    const updates = fieldIds.map((id, index) => ({
      id,
      display_order: index
    }));
    
    for (const update of updates) {
      const { error } = await supabase
        .from('profile_section_fields')
        .update({ display_order: update.display_order })
        .eq('id', update.id)
        .eq('section_id', sectionId);
      
      if (error) throw error;
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error reordering profile section fields:', error);
    return { success: false, error };
  }
}
