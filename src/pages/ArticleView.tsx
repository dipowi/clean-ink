import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import "./article-overrides.css";

interface Article {
  id: string;
  title: string;
  content: string;
  slug: string;
  author_name?: string;
  created_at: string;
  view_count: number;
}

export default function ArticleView() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const fetchArticle = async () => {
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .eq('slug', slug)
          .eq('published', true)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            setError('Article not found');
          } else {
            throw error;
          }
          return;
        }

        setArticle(data);

        // Increment view count
        await supabase
          .from('articles')
          .update({ view_count: data.view_count + 1 })
          .eq('id', data.id);

      } catch (error) {
        console.error('Error fetching article:', error);
        setError('Failed to load article');
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const optimizeArticleHTML = (html: string) => {
    if (!html) return '';
    try {
      // Lazy load images
      html = html.replace(/<img\s/gi, '<img loading="lazy" decoding="async" fetchpriority="low" referrerpolicy="no-referrer-when-downgrade" ');
      // Lazy load iframes
      html = html.replace(/<iframe\s/gi, '<iframe loading="lazy" ');
      // Optimize videos
      html = html.replace(/<video\s/gi, '<video preload="metadata" ');
      return html;
    } catch {
      return html;
    }
  };

  const optimizedContent = useMemo(() => optimizeArticleHTML(article?.content || ''), [article?.content]);

  useEffect(() => {
    if (!article) return;
    const tmp = document.createElement('div');
    tmp.innerHTML = article.content || '';
    const text = (tmp.textContent || '').replace(/\s+/g, ' ').trim();
    const description = text.slice(0, 160);

    document.title = article.title;

    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = description;

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.href;
  }, [article]);

  if (loading) return null;

  if (error || !article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The article you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-[880px] mx-auto px-4 sm:px-6 md:px-8 py-12 md:py-20">
        <article>
          <header className="mb-8 md:mb-10">
            <h1 className="text-[32px] sm:text-[36px] md:text-[48px] font-bold text-foreground mb-4 md:mb-6 leading-[1.2] tracking-[-0.01em]">
              {article.title}
            </h1>
          </header>

          <div 
            className="article-content text-[17px] md:text-[18px] leading-8 md:leading-9"
            dangerouslySetInnerHTML={{ __html: optimizedContent }}
          />
        </article>
      </div>
    </div>
  );
}