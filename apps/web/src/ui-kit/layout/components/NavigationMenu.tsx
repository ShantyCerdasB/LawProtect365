import { Link } from 'react-router-dom';
import type { ReactElement } from 'react';
import type { NavigationMenuProps } from '../interfaces/NavigationMenuInterfaces';

export function NavigationMenu({
  items,
  className = '',
  itemClassName = '',
}: NavigationMenuProps): ReactElement {

  return (
    <nav className={className}>
      <ul className={`flex ${className.includes('flex-col') ? 'flex-col' : 'flex-row flex-wrap'} items-center gap-4 md:gap-6`}>
        {items.map((item) => {
          return (
            <li key={item.id}>
              <Link
                to={item.path}
                className={`text-white text-lg md:text-xl hover:text-white hover:font-normal hover:text-2xl transition-all cursor-pointer ${itemClassName}`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

