import AuthForm from "@/components/auth/auth-form";
import { Container } from "@medusajs/ui";

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Container>
        <AuthForm />
      </Container>
    </div>
  );
}
