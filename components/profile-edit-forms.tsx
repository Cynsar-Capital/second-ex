import { useState } from "react";
import { Button, FocusModal, Input, Label, Text, Textarea } from "@medusajs/ui";
import { Check } from "@medusajs/icons";

interface ProfileEditFormsProps {
  open: boolean;
  onClose: () => void;
  formType: "profile" | "bio" | "work" | "work-item";
  initialData?: any;
  onSubmit: (data: any) => void;
  workItemIndex?: number;
}

export const ProfileEditForms = ({
  open,
  onClose,
  formType,
  initialData,
  onSubmit,
  workItemIndex
}: ProfileEditFormsProps) => {
  // State for form data
  const [formData, setFormData] = useState(initialData || {});
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    // Call onSubmit with the form data
    onSubmit(formData);
  };
  
  // Determine form title and content based on formType
  const getFormContent = () => {
    switch (formType) {
      case "profile":
        return {
          title: "Edit Profile Information",
          subtitle: "Update your profile details",
          form: (
            <>
              <div className="mb-4">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  value={formData.name || ""} 
                  onChange={handleChange}
                  className="mt-1"
                  required
                />
              </div>
              <div className="mb-4">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email"
                  value={formData.email || ""} 
                  onChange={handleChange}
                  className="mt-1"
                />
              </div>
              <div className="mb-4">
                <Label htmlFor="website">Website</Label>
                <Input 
                  id="website" 
                  name="website" 
                  value={formData.website || ""} 
                  onChange={handleChange}
                  className="mt-1"
                  placeholder="https://example.com"
                />
              </div>
            </>
          )
        };
        
      case "bio":
        return {
          title: "Edit Bio",
          subtitle: "Tell others about yourself",
          form: (
            <div className="mb-4">
              <Label htmlFor="bio">About</Label>
              <Textarea 
                id="bio" 
                name="bio" 
                value={formData.bio || ""} 
                onChange={handleChange}
                className="mt-1 min-h-[150px]"
                placeholder="Write a short bio about yourself..."
              />
            </div>
          )
        };
        
      case "work":
        return {
          title: "Edit Work History",
          subtitle: "Manage your work experience",
          form: (
            <div className="mb-4">
              <Text className="mb-4">This will allow you to edit your entire work history.</Text>
              <Text className="text-ui-fg-subtle">Feature coming soon.</Text>
            </div>
          )
        };
        
      case "work-item":
        return {
          title: workItemIndex !== undefined && workItemIndex >= 0 ? "Edit Work Experience" : "Add Work Experience",
          subtitle: "Update your work experience details",
          form: (
            <>
              <div className="mb-4">
                <Label htmlFor="position">Position</Label>
                <Input 
                  id="position" 
                  name="position" 
                  value={formData.position || ""} 
                  onChange={handleChange}
                  className="mt-1"
                  required
                />
              </div>
              <div className="mb-4">
                <Label htmlFor="company">Company</Label>
                <Input 
                  id="company" 
                  name="company" 
                  value={formData.company || ""} 
                  onChange={handleChange}
                  className="mt-1"
                  required
                />
              </div>
              <div className="mb-4">
                <Label htmlFor="years">Years</Label>
                <Input 
                  id="years" 
                  name="years" 
                  value={formData.years || ""} 
                  onChange={handleChange}
                  className="mt-1"
                  placeholder="2020 - Present"
                  required
                />
              </div>
              <div className="mb-4">
                <Label htmlFor="respo">Responsibilities</Label>
                <Textarea 
                  id="respo" 
                  name="respo" 
                  value={formData.respo || ""} 
                  onChange={handleChange}
                  className="mt-1 min-h-[100px]"
                  placeholder="Describe your responsibilities and achievements..."
                  required
                />
              </div>
            </>
          )
        };
        
      default:
        return {
          title: "Edit Profile",
          subtitle: "Update your profile information",
          form: <div>Form not found</div>
        };
    }
  };
  
  const { title, subtitle, form } = getFormContent();
  
  return (
    <FocusModal open={open} onOpenChange={onClose}>
      {/* We don't need a trigger as we control open state from parent */}
      <FocusModal.Content style={{ zIndex: 50, display: 'flex', flexDirection: 'column', height: '90vh' }}>
        <FocusModal.Header>
        </FocusModal.Header>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          <FocusModal.Body className="flex flex-col items-center py-8 flex-1">
            <div className="flex w-full max-w-lg flex-col gap-y-6">
              <div className="mb-2">
                <Text className="text-lg font-bold">{title}</Text>
                <Text className="text-ui-fg-subtle text-sm">{subtitle}</Text>
              </div>
              <div className="flex flex-col gap-y-4">
                {form}
              </div>
            </div>
            {/* Spacer to push footer to bottom */}
            <div className="flex-grow"></div>
          </FocusModal.Body>
          <FocusModal.Footer className="border-t border-ui-border-base py-3 px-4 sticky bottom-0 bg-white dark:bg-slate-900">
            <div className="flex w-full justify-end gap-x-2">
              <Button
                variant="secondary"
                onClick={(e) => {
                  e.preventDefault();
                  onClose();
                }}
                size="small"
                type="button"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                className="gap-x-2"
                size="small"
              >
                <Check className="text-ui-fg-on-color h-4 w-4" />
                Save changes
              </Button>
            </div>
          </FocusModal.Footer>
        </form>
      </FocusModal.Content>
    </FocusModal>
  );
};
