import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

export function Header() {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className="fixed top-0 w-full bg-background/80 backdrop-blur-md border-b border-border z-50">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-light rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">职</span>
            </div>
            <span className="font-bold text-xl text-foreground">职业指导平台</span>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => scrollToSection('services')}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              服务介绍
            </button>
            <button 
              onClick={() => scrollToSection('audience')}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              用户群体
            </button>
            <button 
              onClick={() => scrollToSection('resources')}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              资源中心
            </button>
            <button 
              onClick={() => scrollToSection('contact')}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              联系我们
            </button>
          </nav>
          
          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="primary" onClick={() => scrollToSection('assessment')}>
              开始测评
            </Button>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center space-x-2">
            <Button variant="primary" size="sm" onClick={() => scrollToSection('assessment')}>
              开始测评
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <nav className="flex flex-col space-y-6 mt-6">
                  <button 
                    onClick={() => scrollToSection('services')}
                    className="text-left text-muted-foreground hover:text-primary transition-colors"
                  >
                    服务介绍
                  </button>
                  <button 
                    onClick={() => scrollToSection('audience')}
                    className="text-left text-muted-foreground hover:text-primary transition-colors"
                  >
                    用户群体
                  </button>
                  <button 
                    onClick={() => scrollToSection('resources')}
                    className="text-left text-muted-foreground hover:text-primary transition-colors"
                  >
                    资源中心
                  </button>
                  <button 
                    onClick={() => scrollToSection('contact')}
                    className="text-left text-muted-foreground hover:text-primary transition-colors"
                  >
                    联系我们
                  </button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
          
        </div>
      </div>
    </header>
  );
}