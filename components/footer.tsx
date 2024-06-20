// components/Footer.js
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-between">
          <div className="w-full sm:w-1/2 lg:w-1/3 mb-6 sm:mb-0">
            <h5 className="font-bold mb-2">About Me</h5>
            <p className="text-sm text-gray-400">
              I am definitely commited to bring a change.
            </p>
          </div>
          <div className="w-full sm:w-1/2 lg:w-1/3 mb-6 sm:mb-0">
            <h5 className="font-bold mb-2">Contact</h5>
            <ul className="text-sm text-gray-400">
              <li className="mb-2">
                <Link href="mailto:saransh@cynsar.capital">
                  saransh@cynsar.capital
                </Link>
              </li>
              <li className="mb-2">
                <Link href="tel:+123456789">
                  +1 206 SEND ME A MAIL FIRST THEN GET MY NUMBER
                </Link>
              </li>
            </ul>
          </div>
          <div className="w-full lg:w-1/3">
            <h5 className="font-bold mb-2">Follow Us</h5>
            <ul className="text-sm text-gray-400 flex space-x-4">
              <li>
                <Link href="">There is no</Link>
              </li>
              <li>
                <Link href="">Better</Link>
              </li>
              <li>
                <Link href="">Time Leaving </Link>
              </li>
              <li>
                <Link href="">Social Media</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Saransh Sharma All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
