import { supabase } from '@/supabase/utils';
import { v4 as uuidv4 } from 'uuid';
import { ProfileSectionField, NewProfileSectionField } from './profile-sections';

/**
 * Create a new field for a profile section
 */
export async function createProfileSectionField(sectionId: string, fieldData: NewProfileSectionField) {
  try {
    // Get the highest display_order and add 1
    const { data: highestOrder } = await supabase
      .from('profile_section_fields')
      .select('display_order')
      .eq('section_id', sectionId)
      .order('display_order', { ascending: false })
      .limit(1);
    
    const nextOrder = highestOrder && highestOrder.length > 0 && highestOrder[0].display_order !== null
      ? highestOrder[0].display_order + 1 
      : 0;
    
    // Use provided display_order or the next available order
    const displayOrder = fieldData.display_order !== undefined 
      ? fieldData.display_order 
      : nextOrder;
    
    // Create the field
    const { data: field, error } = await supabase
      .from('profile_section_fields')
      .insert({
        section_id: sectionId,
        field_key: fieldData.field_key,
        field_label: fieldData.field_label,
        field_value: fieldData.field_value || '',
        field_type: fieldData.field_type || 'text',
        display_order: displayOrder
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return { field, error: null };
  } catch (error) {
    console.error('Error creating profile section field:', error);
    return { field: null, error };
  }
}

/**
 * Update an existing profile section field
 */
export async function updateProfileSectionField(fieldId: string, fieldData: Partial<ProfileSectionField>) {
  try {
    const { data: field, error } = await supabase
      .from('profile_section_fields')
      .update({
        field_key: fieldData.field_key,
        field_label: fieldData.field_label,
        field_value: fieldData.field_value,
        field_type: fieldData.field_type,
        display_order: fieldData.display_order
      })
      .eq('id', fieldId)
      .select()
      .single();
    
    if (error) throw error;
    
    return { field, error: null };
  } catch (error) {
    console.error('Error updating profile section field:', error);
    return { field: null, error };
  }
}

/**
 * Delete a profile section field
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
 * Get all fields for a profile section
 */
export async function getProfileSectionFields(sectionId: string) {
  try {
    const { data: fields, error } = await supabase
      .from('profile_section_fields')
      .select('*')
      .eq('section_id', sectionId)
      .order('display_order', { ascending: true });
    
    if (error) throw error;
    
    return { fields, error: null };
  } catch (error) {
    console.error('Error fetching profile section fields:', error);
    return { fields: [], error };
  }
}

/**
 * Reorder profile section fields
 */
export async function reorderProfileSectionFields(sectionId: string, fieldIds: string[]) {
  try {
    // Update each field's display_order based on its position in the array
    for (let i = 0; i < fieldIds.length; i++) {
      const { error } = await supabase
        .from('profile_section_fields')
        .update({ display_order: i })
        .eq('id', fieldIds[i])
        .eq('section_id', sectionId);
      
      if (error) throw error;
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error reordering profile section fields:', error);
    return { success: false, error };
  }
}
