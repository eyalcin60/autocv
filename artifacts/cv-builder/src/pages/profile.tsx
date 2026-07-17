import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useGetProfile, useUpsertProfile, getGetProfileQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Save, User } from 'lucide-react';

const profileSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  linkedinUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")).nullable(),
  githubUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")).nullable(),
  websiteUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")).nullable(),
  summary: z.string().optional().nullable(),
  skills: z.string().optional().nullable(), // Store as comma-separated or JSON string internally? 
  // Wait, schema says: JSON array of skill strings. Let's just manage it as a single string and JSON.stringify it on save if needed, or better just use strings.
  // Actually, let's treat it as comma separated in UI, and JSON string for API.
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function Profile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: profile, isLoading } = useGetProfile({
    query: { queryKey: getGetProfileQueryKey() }
  });

  const upsertProfile = useUpsertProfile({
    mutation: {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetProfileQueryKey(), data);
        toast({
          title: "Profile updated",
          description: "Your professional profile has been saved.",
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to update profile.",
          variant: "destructive",
        });
      }
    }
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      location: "",
      linkedinUrl: "",
      githubUrl: "",
      websiteUrl: "",
      summary: "",
      skills: "",
    }
  });

  React.useEffect(() => {
    if (profile) {
      let skillsStr = "";
      try {
        if (profile.skills) {
          skillsStr = JSON.parse(profile.skills).join(", ");
        }
      } catch (e) {
        skillsStr = profile.skills || "";
      }
      
      form.reset({
        fullName: profile.fullName || "",
        email: profile.email || "",
        phone: profile.phone || "",
        location: profile.location || "",
        linkedinUrl: profile.linkedinUrl || "",
        githubUrl: profile.githubUrl || "",
        websiteUrl: profile.websiteUrl || "",
        summary: profile.summary || "",
        skills: skillsStr,
      });
    }
  }, [profile, form]);

  const onSubmit = (data: ProfileFormValues) => {
    let skillsJson = "[]";
    if (data.skills) {
      skillsJson = JSON.stringify(data.skills.split(",").map(s => s.trim()).filter(Boolean));
    }
    
    upsertProfile.mutate({
      data: {
        ...data,
        phone: data.phone || undefined,
        location: data.location || undefined,
        linkedinUrl: data.linkedinUrl || undefined,
        githubUrl: data.githubUrl || undefined,
        websiteUrl: data.websiteUrl || undefined,
        summary: data.summary || undefined,
        skills: skillsJson,
        languages: "[]", // Just placeholder for now
      }
    });
  };

  if (isLoading) {
    return <div className="p-8 animate-pulse flex space-y-4 flex-col max-w-3xl mx-auto"><div className="h-8 bg-muted rounded w-1/3"></div><div className="h-[600px] bg-muted rounded w-full"></div></div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto w-full space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Professional Profile</h1>
        <p className="text-muted-foreground mt-1">
          This data forms the foundation of your AI-generated documents. The more detail you provide, the better the results.
        </p>
      </header>

      <Card className="rounded-none shadow-sm border-t-4 border-t-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-bold">
            <User className="w-5 h-5" /> Identity & Contact
          </CardTitle>
          <CardDescription>
            Your core details as they will appear on your resume.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-xs uppercase tracking-wide">Full Name</FormLabel>
                      <FormControl>
                        <Input className="rounded-sm font-medium" placeholder="Jane Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-xs uppercase tracking-wide">Email</FormLabel>
                      <FormControl>
                        <Input className="rounded-sm font-medium" type="email" placeholder="jane@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-xs uppercase tracking-wide">Phone</FormLabel>
                      <FormControl>
                        <Input className="rounded-sm font-medium" placeholder="+1 (555) 000-0000" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-xs uppercase tracking-wide">Location</FormLabel>
                      <FormControl>
                        <Input className="rounded-sm font-medium" placeholder="San Francisco, CA" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold border-b pb-2">Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="linkedinUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono text-xs uppercase tracking-wide">LinkedIn URL</FormLabel>
                        <FormControl>
                          <Input className="rounded-sm text-sm" placeholder="https://linkedin.com/in/..." {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="githubUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono text-xs uppercase tracking-wide">GitHub URL</FormLabel>
                        <FormControl>
                          <Input className="rounded-sm text-sm" placeholder="https://github.com/..." {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="websiteUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono text-xs uppercase tracking-wide">Personal Website</FormLabel>
                        <FormControl>
                          <Input className="rounded-sm text-sm" placeholder="https://..." {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold border-b pb-2">Content</h3>
                <FormField
                  control={form.control}
                  name="summary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-xs uppercase tracking-wide">Professional Summary</FormLabel>
                      <FormControl>
                        <Textarea 
                          className="min-h-[120px] rounded-sm font-serif leading-relaxed" 
                          placeholder="A brief overview of your career, expertise, and goals..." 
                          {...field} 
                          value={field.value || ''} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="skills"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-xs uppercase tracking-wide">Skills (comma separated)</FormLabel>
                      <FormControl>
                        <Textarea 
                          className="rounded-sm font-mono text-sm min-h-[80px]" 
                          placeholder="React, TypeScript, Node.js, Leadership, Agile..." 
                          {...field} 
                          value={field.value || ''} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button 
                  type="submit" 
                  disabled={upsertProfile.isPending}
                  className="gap-2 font-mono text-xs uppercase font-bold tracking-widest rounded-sm"
                >
                  <Save className="w-4 h-4" /> 
                  {upsertProfile.isPending ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
