import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateApplication, getListApplicationsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Briefcase, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

const applicationSchema = z.object({
  jobTitle: z.string().min(1, "Job title is required"),
  company: z.string().min(1, "Company is required"),
  jobUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")).nullable(),
  jobDescription: z.string().min(20, "Please paste the job description (min 20 characters)"),
  notes: z.string().optional().nullable(),
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

export default function ApplicationNew() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      jobTitle: "",
      company: "",
      jobUrl: "",
      jobDescription: "",
      notes: "",
    }
  });

  const createMutation = useCreateApplication({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
        toast({
          title: "Application created",
          description: "Workspace initialized successfully.",
        });
        setLocation(`/applications/${data.id}`);
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to create application.",
          variant: "destructive",
        });
      }
    }
  });

  const onSubmit = (data: ApplicationFormValues) => {
    createMutation.mutate({
      data: {
        ...data,
        jobUrl: data.jobUrl || undefined,
        notes: data.notes || undefined,
      }
    });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto w-full space-y-6 animate-in fade-in duration-500">
      <Link href="/applications" className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Applications
      </Link>
      
      <header>
        <h1 className="text-3xl font-bold tracking-tight">New Application</h1>
        <p className="text-muted-foreground mt-1">
          Create a workspace to tailor your CV and Cover Letter for a specific role.
        </p>
      </header>

      <Card className="rounded-none shadow-sm border-t-4 border-t-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-bold">
            <Briefcase className="w-5 h-5" /> Role Details
          </CardTitle>
          <CardDescription>
            Provide the details of the job you are applying for. The AI will use the job description to match your skills.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="jobTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-xs uppercase tracking-wide">Job Title</FormLabel>
                      <FormControl>
                        <Input className="rounded-sm font-medium" placeholder="Senior Frontend Engineer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-xs uppercase tracking-wide">Company</FormLabel>
                      <FormControl>
                        <Input className="rounded-sm font-medium" placeholder="Acme Corp" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="jobUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs uppercase tracking-wide">Job Posting URL (Optional)</FormLabel>
                    <FormControl>
                      <Input className="rounded-sm text-sm" placeholder="https://..." {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jobDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs uppercase tracking-wide flex justify-between">
                      <span>Job Description</span>
                      <span className="text-muted-foreground font-normal normal-case">Paste full text</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        className="min-h-[250px] rounded-sm font-serif leading-relaxed text-sm p-4" 
                        placeholder="Paste the full job description here..." 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      The AI will extract keywords, tone, and requirements from this text.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs uppercase tracking-wide">Private Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        className="min-h-[100px] rounded-sm text-sm" 
                        placeholder="Any context you want the AI to know (e.g. 'Emphasize my leadership experience')" 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-4 border-t">
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending}
                  className="gap-2 font-mono text-xs uppercase font-bold tracking-widest rounded-sm"
                >
                  {createMutation.isPending ? 'Creating Workspace...' : 'Initialize Workspace'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
