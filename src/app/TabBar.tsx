import { NavLink } from 'react-router';
import { BookIcon, CalcIcon, ChartIcon, FlaskIcon } from '@/ui/icons';

const tabs = [
  { to: '/book', label: 'Book', Icon: BookIcon },
  { to: '/reagents', label: 'Reagents', Icon: FlaskIcon },
  { to: '/calc', label: 'Calculations', Icon: CalcIcon },
  { to: '/progress', label: 'Progress', Icon: ChartIcon },
];

export function TabBar() {
  return (
    <nav
      aria-label="Main"
      className="border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-4">
        {tabs.map(({ to, label, Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs ${
                  isActive ? 'text-accent' : 'text-muted'
                }`
              }
            >
              <Icon />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
