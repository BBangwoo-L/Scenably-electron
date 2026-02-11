import { Link } from "react-router-dom";

export function Header() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <Link
            to="/"
            className="hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center space-x-3">
              <span className="font-bold text-xl">Scenably</span>
            </div>
          </Link>

          <nav className="flex items-center gap-3 text-sm text-muted-foreground">
            <Link to="/schedules" className="hover:text-foreground transition-colors">
              스케줄 관리
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
