'use client'
import Link from 'next/link';
import { HomeIcon, ClockIcon } from '@heroicons/react/24/outline'; // Removed UserCircleIcon and PlusCircleIcon
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Home', icon: HomeIcon },
  { href: '/history', label: 'History', icon: ClockIcon },
  // { href: '/profile', label: 'Profile', icon: UserCircleIcon }, // Example for future
];

export default function BottomNav() {
  const pathname = usePathname();

  // Don't show bottom nav on login/signup pages or during an active workout session log flow
  if (pathname === '/login' || pathname === '/signup' || pathname.startsWith('/workout/')) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-800 bg-black">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center space-y-1 p-3 rounded-md 
                          ${isActive 
                            ? 'text-emerald-500' 
                            : 'text-gray-400 hover:text-white'
                          } transition-colors duration-150 ease-in-out group`}
            >
              <item.icon className={`h-6 w-6 ${isActive ? '' : 'text-gray-500 group-hover:text-gray-200'}`} />
              <span className={`text-xs font-medium ${isActive ? '' : 'group-hover:text-gray-200'}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
} 