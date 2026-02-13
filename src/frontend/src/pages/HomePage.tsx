import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from '@tanstack/react-router';
import { Music, GraduationCap, ShoppingCart, Users } from 'lucide-react';
import { Difficulty } from '../types';
import { useListTutorials, useListProducts, useGetHeroSettings } from '../hooks/useQueries';
import ExternalBlobImage from '../components/ExternalBlobImage';

export default function HomePage() {
  const navigate = useNavigate();
  const { data: tutorials = [] } = useListTutorials();
  const { data: products = [] } = useListProducts();
  const { data: heroSettings } = useGetHeroSettings();

  // Use hero settings or fallback to defaults
  const heroHeadline = heroSettings?.heroHeadline || 'Master the Ocarina';
  const heroSubheadline = heroSettings?.heroSubheadline || 'Learn, create, and share beautiful music with our community';
  const heroImageUrl = heroSettings?.heroImage?.getDirectURL() || '/assets/generated/ocarina-hero.dim_800x600.jpg';

  const featuredTutorials = tutorials.filter(t => t.isFree).slice(0, 3);
  const featuredProducts = products.slice(0, 3);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative h-[500px] flex items-center justify-center overflow-hidden">
        {heroSettings?.heroImage ? (
          <ExternalBlobImage
            blob={heroSettings.heroImage}
            alt="Hero"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <img
            src={heroImageUrl}
            alt="Hero"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-background/50" />
        <div className="container relative z-10 text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            {heroHeadline}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {heroSubheadline}
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate({ to: '/learning' })}>
              Start Learning
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate({ to: '/store' })}>
              Browse Store
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate({ to: '/learning' })}>
            <CardHeader>
              <GraduationCap className="h-12 w-12 mb-4 text-primary" />
              <CardTitle>Learn</CardTitle>
              <CardDescription>
                Master the ocarina with expert tutorials and AI-powered guidance
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate({ to: '/community' })}>
            <CardHeader>
              <Users className="h-12 w-12 mb-4 text-primary" />
              <CardTitle>Community</CardTitle>
              <CardDescription>
                Share your music and connect with fellow musicians
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate({ to: '/store' })}>
            <CardHeader>
              <ShoppingCart className="h-12 w-12 mb-4 text-primary" />
              <CardTitle>Store</CardTitle>
              <CardDescription>
                Browse quality ocarinas and accessories
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Featured Tutorials */}
      {featuredTutorials.length > 0 && (
        <section className="container py-16">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold">Featured Tutorials</h2>
              <p className="text-muted-foreground">Start learning for free</p>
            </div>
            <Button variant="outline" onClick={() => navigate({ to: '/learning' })}>
              View All
            </Button>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {featuredTutorials.map((tutorial) => (
              <Card key={tutorial.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-muted flex items-center justify-center relative">
                  <video
                    src={tutorial.video.blob.getDirectURL()}
                    className="w-full h-full object-cover"
                    preload="metadata"
                  />
                  <Badge className="absolute top-2 left-2 bg-green-600">FREE</Badge>
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
        <section className="container py-16">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold">Featured Products</h2>
              <p className="text-muted-foreground">Quality instruments for every musician</p>
            </div>
            <Button variant="outline" onClick={() => navigate({ to: '/store' })}>
              View All
            </Button>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {featuredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-muted flex items-center justify-center">
                  {product.images.length > 0 ? (
                    <ExternalBlobImage
                      blob={product.images[0].blob}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      fallbackIcon={<Music className="h-16 w-16 text-muted-foreground" />}
                    />
                  ) : (
                    <Music className="h-16 w-16 text-muted-foreground" />
                  )}
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
