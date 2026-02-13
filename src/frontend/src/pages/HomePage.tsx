import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, ShoppingBag, Music, Play, Gift } from 'lucide-react';
import { useListTutorials, useListProducts } from '../hooks/useQueries';
import { Difficulty } from '../backend';

export default function HomePage() {
  const navigate = useNavigate();
  const { data: tutorials = [] } = useListTutorials();
  const { data: products = [] } = useListProducts();

  // Prioritize free tutorials and beginner level for featured section
  const featuredTutorials = [...tutorials]
    .sort((a, b) => {
      if (a.isFree && !b.isFree) return -1;
      if (!a.isFree && b.isFree) return 1;
      if (a.difficulty === Difficulty.beginner && b.difficulty !== Difficulty.beginner) return -1;
      if (a.difficulty !== Difficulty.beginner && b.difficulty === Difficulty.beginner) return 1;
      return 0;
    })
    .slice(0, 3);

  const featuredProducts = products.slice(0, 3);

  return (
    <div className="container py-8 space-y-16">
      {/* Hero Section */}
      <section className="relative rounded-2xl overflow-hidden">
        <img
          src="/assets/generated/ocarina-hero.dim_800x600.jpg"
          alt="Ocarina Hero"
          className="w-full h-[400px] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-transparent flex items-center">
          <div className="container">
            <div className="max-w-2xl space-y-6">
              <h1 className="text-5xl font-bold tracking-tight">
                Learn, Share, and Master the <span className="text-primary">Ocarina</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Join our community of musicians. Access tutorials, share your music, and find the perfect ocarina.
              </p>
              <div className="flex gap-4">
                <Button size="lg" onClick={() => navigate({ to: '/learning' })} className="gap-2">
                  <BookOpen className="h-5 w-5" />
                  Start Learning
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate({ to: '/community' })} className="gap-2">
                  <Users className="h-5 w-5" />
                  Join Community
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate({ to: '/learning' })}>
          <CardHeader>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Video Tutorials</CardTitle>
            <CardDescription>
              Learn from beginner to advanced with our comprehensive video library
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate({ to: '/community' })}>
          <CardHeader>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Community</CardTitle>
            <CardDescription>
              Share your recordings and connect with fellow ocarina enthusiasts
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate({ to: '/store' })}>
          <CardHeader>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <ShoppingBag className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Shop</CardTitle>
            <CardDescription>
              Find quality ocarinas, accessories, and sheet music for your journey
            </CardDescription>
          </CardHeader>
        </Card>
      </section>

      {/* Featured Tutorials */}
      {featuredTutorials.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">Featured Tutorials</h2>
              <p className="text-muted-foreground">Start your learning journey today</p>
            </div>
            <Button variant="outline" onClick={() => navigate({ to: '/learning' })}>
              View All
            </Button>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {featuredTutorials.map((tutorial) => (
              <Card 
                key={tutorial.id} 
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate({ to: '/learning' })}
              >
                <div className="relative aspect-video bg-muted">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play className="h-12 w-12 text-primary" />
                  </div>
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Play className="h-16 w-16 text-white drop-shadow-lg" />
                  </div>
                  {tutorial.isFree && (
                    <Badge className="absolute top-2 left-2 bg-green-600 text-white gap-1">
                      <Gift className="h-3 w-3" />
                      FREE
                    </Badge>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-1">{tutorial.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{tutorial.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">Featured Products</h2>
              <p className="text-muted-foreground">Quality instruments and accessories</p>
            </div>
            <Button variant="outline" onClick={() => navigate({ to: '/store' })}>
              View Store
            </Button>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {featuredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-muted flex items-center justify-center">
                  <Music className="h-16 w-16 text-muted-foreground" />
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-1">{product.name}</CardTitle>
                  <CardDescription className="line-clamp-2">{product.description}</CardDescription>
                  <div className="text-2xl font-bold text-primary pt-2">
                    ${(Number(product.price) / 100).toFixed(2)}
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
