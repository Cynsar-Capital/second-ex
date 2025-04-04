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
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
