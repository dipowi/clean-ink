import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload } from "lucide-react";

export default function CreatePost() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [slug, setSlug] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(value));
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('article-images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('article-images')
        .getPublicUrl(fileName);

      // Insert image HTML at cursor position
      const imageHtml = `<img src="${publicUrl}" alt="Uploaded image" />`;
      setContent(prev => prev + imageHtml);
      
      toast({
        title: "Image uploaded successfully",
        description: "Image has been added to your article"
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim() || !slug.trim()) {
      toast({
        title: "Missing fields",
        description: "Title, content, and URL are required",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('articles')
        .insert({
          title: title.trim(),
          content: content.trim(),
          slug: slug.trim(),
          author_name: authorName.trim() || null
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "URL already exists",
            description: "Please choose a different URL",
            variant: "destructive"
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Article published!",
        description: "Your article has been published successfully"
      });
      
      navigate(`/${slug}`);
    } catch (error) {
      console.error('Error creating article:', error);
      toast({
        title: "Publishing failed",
        description: "Failed to publish article. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-4 hover:bg-muted"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
          </Button>
          
          <h1 className="text-3xl font-bold text-foreground">Create New Article</h1>
          <p className="text-muted-foreground mt-2">Share your story with the world</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="author">Author Name (Optional)</Label>
            <Input
              id="author"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Your name"
              className="text-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter article title"
              className="text-xl font-semibold"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Article URL *</Label>
            <div className="flex items-center">
              <span className="text-muted-foreground mr-1">/{}</span>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="article-url"
                className="flex-1"
                required
              />
            </div>
            <p className="text-sm text-muted-foreground">
              This will be your article's URL. Use lowercase letters and hyphens only.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">Content (HTML) *</Label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <Label
                  htmlFor="image-upload"
                  className="flex items-center gap-2 cursor-pointer text-sm bg-muted hover:bg-muted/80 px-3 py-1 rounded-md transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  {isUploading ? "Uploading..." : "Upload Image"}
                </Label>
              </div>
            </div>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your article content here. You can use HTML tags for formatting..."
              className="min-h-[400px] font-mono text-base leading-relaxed"
              required
            />
            <p className="text-sm text-muted-foreground">
              You can paste HTML content from Blogger or any HTML editor. Images, formatting, and links are supported.
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="px-8"
            >
              {isSubmitting ? "Publishing..." : "Publish Article"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}