import React from 'react';
import { Cloud } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Cloud className="h-6 w-6 text-blue-400" />
            <span className="text-xl font-bold text-white">Free Clouds</span>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-gray-400">
            <div>
              © 2024 Free Clouds. All rights reserved.
            </div>
            <div className="text-blue-400 font-medium">
              By Hoàng Minh Khang
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
