import { useState, type ReactElement } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../app/store/useAuthStore';
import { Button } from '../buttons/Button';
import { Logo } from './components/Logo';
import { NavigationMenu } from './components/NavigationMenu';
import { SearchBar } from './components/SearchBar';
import { menuConfig } from './config/menuConfig';

export function Header(): ReactElement {
  const { isAuthenticated, login, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const publicMenuItems = menuConfig.filter((item) => item.showWhenLoggedOut && !item.requiresAuth);

  const handleSignIn = async () => {
    await login();
    navigate('/dashboard');
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/');
  };

  const handleSearch = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <header className="bg-blue text-white sticky top-0 z-50 shadow-lg">
      <div className="w-full">
        <div className="flex items-center h-16 md:h-20">
          <div className="shrink-0 ml-4 md:ml-6">
            <Link to="/">
              <Logo />
            </Link>
          </div>

          {isAuthenticated ? (
            <div className="flex-1 flex items-center justify-end gap-4 mr-4 md:mr-6">
              <div className="hidden md:block flex-1 max-w-md mx-auto">
                <SearchBar onSearch={handleSearch} />
              </div>
              <Button
                variant="outline"
                size="md"
                onClick={() => navigate('/account')}
                className="whitespace-nowrap"
              >
                MY ACCOUNT
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={handleSignOut}
                className="whitespace-nowrap"
              >
                SIGN OUT
              </Button>
            </div>
          ) : (
            <>
              <div className="flex-1 flex items-center justify-center">
                <div className="hidden md:block">
                  <NavigationMenu items={publicMenuItems} />
                </div>
              </div>
              <div className="flex items-center gap-3 md:gap-4 mr-4 md:mr-6">
                <Link
                  to="/register"
                  className="text-white text-lg md:text-xl hover:text-white hover:font-normal hover:text-2xl transition-all hidden md:block cursor-pointer"
                >
                  REGISTER
                </Link>
                <Button variant="outline" size="md" onClick={handleSignIn} className="whitespace-nowrap">
                  SIGN IN
                </Button>
                <button
                  type="button"
                  className="md:hidden text-white hover:text-emerald transition-colors p-2 cursor-pointer"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label="Toggle menu"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {isMobileMenuOpen ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    )}
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>

        {!isAuthenticated && isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/20 py-4 px-4">
            <NavigationMenu items={publicMenuItems} className="flex-col" />
            <div className="mt-4">
              <Link
                to="/register"
                className="block text-white text-lg hover:text-white hover:font-normal hover:text-xl transition-all py-2 cursor-pointer"
              >
                REGISTER
              </Link>
            </div>
          </div>
        )}

        {isAuthenticated && (
          <div className="md:hidden border-t border-white/20 py-4">
            <SearchBar onSearch={handleSearch} />
          </div>
        )}
      </div>
    </header>
  );
}

