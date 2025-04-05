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
    const sectionsWithFields = sections.map(section => ({
      ...section,
      fields: fields?.filter(field => field.section_id === section.id) || []
    }));
    
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
    
    // If fields are provided, update them
    if (fields && fields.length > 0) {
      // First, get existing fields
      const { data: existingFields } = await supabase
        .from('profile_section_fields')
        .select('id')
        .eq('section_id', sectionId);
      
      const existingFieldIds = existingFields?.map(f => f.id) || [];
      
      // Separate fields into updates and inserts
      const fieldsToUpdate = fields.filter(f => f.id && existingFieldIds.includes(f.id));
      const fieldsToInsert = fields.filter(f => !f.id || !existingFieldIds.includes(f.id));
      
      // Update existing fields
      if (fieldsToUpdate.length > 0) {
        for (const field of fieldsToUpdate) {
          await supabase
            .from('profile_section_fields')
            .update({
              field_key: field.field_key,
              field_label: field.field_label,
              field_value: field.field_value,
              field_type: field.field_type,
              display_order: field.display_order
            })
            .eq('id', field.id);
        }
      }
      
      // Insert new fields
      if (fieldsToInsert.length > 0) {
        const newFields = fieldsToInsert.map(field => ({
          section_id: sectionId,
          field_key: field.field_key || uuidv4(),
          field_label: field.field_label,
          field_value: field.field_value || '',
          field_type: field.field_type || 'text',
          display_order: field.display_order || 0
        }));
        
        await supabase
          .from('profile_section_fields')
          .insert(newFields);
      }
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
 * Delete a profile section and all its fields
 */
export async function deleteProfileSection(sectionId: string) {
  try {
    // The fields will be automatically deleted due to the ON DELETE CASCADE constraint
    const { data, error } = await supabase
      .from('profile_sections')
      .delete()
      .eq('id', sectionId);
    
    if (error) throw error;
    
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
