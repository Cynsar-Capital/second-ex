// components/Footer.js
import Link from "next/link";
import { Container, Text, Heading } from "@medusajs/ui";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12 mt-auto">
      <Container className="bg-gray-900">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <Heading level="h3" className="text-xl font-bold mb-4">Second Exchange</Heading>
              <Text className="text-gray-100 mb-6 max-w-md">
                An alternative method to LinkedIn for sharing information. While LinkedIn works on capturing your attention, 
                Second Exchange focuses on meaningful connections and information sharing without the distractions.
              </Text>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-200">Visit us at:</span>
                <Link href="https://2nd.exchange" className="text-sm text-blue-300 hover:text-blue-200 transition">
                  2nd.exchange
                </Link>
              </div>
            </div>
            
            <div>
              <Heading level="h3" className="text-xl font-bold mb-4">Our Mission</Heading>
              <Text className="text-gray-100 mb-6">
                To create a platform that respects your time and attention while enabling meaningful professional connections 
                and knowledge sharing without the addictive mechanics of traditional social media.
              </Text>
              <div className="mt-4">
                <Text className="text-gray-200 text-sm">
                  Access your profile directly via: <span className="text-blue-300 font-medium">username.2nd.exchange</span>
                </Text>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <Text className="text-gray-300 text-sm mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} Second Exchange. All rights reserved.
            </Text>
            <div className="flex space-x-6">
              <Link href="/privacy" className="text-sm text-gray-200 hover:text-white transition">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-gray-200 hover:text-white transition">
                Terms of Service
              </Link>
              <Link href="/about" className="text-sm text-gray-200 hover:text-white transition">
                About Us
              </Link>
              <Link href="https://github.com/saranshisatgit/second-ex" className="text-sm text-gray-200 hover:text-white transition flex items-center">
                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                Contribute
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
