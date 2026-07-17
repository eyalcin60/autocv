import React, { useState, useEffect, useRef } from 'react';
import { useRoute } from 'wouter';
import { 
  useGetApplication, 
  useUpdateApplication, 
  useDeleteApplication,
  useUpdateGeneratedDoc,
  getGetApplicationQueryKey,
  ApplicationWithDocs,
  GeneratedDoc,
  ApplicationUpdateStatus
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useSSE, useDebounce } from '@/hooks/use-sse';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Wand2, Save, ExternalLink, ArrowLeft, Trash2, CheckCircle2, 
  FileText, Briefcase, Building, RefreshCw, Loader2
} from 'lucide-react';
import { Link, useLocation } from 'wouter';

export default function ApplicationWorkspace() {
  const [, params] = useRoute("/applications/:id");
  const id = params?.id ? parseInt(params.id, 10) : 0;
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: app, isLoading } = useGetApplication(id, {
    query: { enabled: !!id, queryKey: getGetApplicationQueryKey(id) }
  });

  const updateAppMutation = useUpdateApplication({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetApplicationQueryKey(id) });
        toast({ title: "Status updated" });
      }
    }
  });

  const deleteAppMutation = useDeleteApplication({
    mutation: {
      onSuccess: () => {
        toast({ title: "Application deleted" });
        setLocation("/applications");
      }
    }
  });

  if (isLoading || !app) {
    return <div className="p-8 space-y-8 animate-pulse"><Skeleton className="h-10 w-1/3" /><Skeleton className="h-[600px] w-full" /></div>;
  }

  const cvDoc = app.generatedDocs?.find(d => d.type === 'cv');
  const coverLetterDoc = app.generatedDocs?.find(d => d.type === 'cover_letter');

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto w-full space-y-6 h-screen flex flex-col overflow-hidden animate-in fade-in duration-500">
      {/* Header Area */}
      <div className="flex-none space-y-4">
        <Link href="/applications" className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{app.jobTitle}</h1>
              <Badge variant="outline" className="font-mono text-xs uppercase tracking-wider bg-secondary">
                {app.company}
              </Badge>
            </div>
            {app.jobUrl && (
              <a href={app.jobUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center mt-2 font-medium">
                View Original Posting <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </a>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <Select 
              value={app.status} 
              onValueChange={(val: ApplicationUpdateStatus) => updateAppMutation.mutate({ id, data: { status: val } })}
            >
              <SelectTrigger className="w-[160px] font-mono text-xs uppercase font-bold tracking-wider h-10 rounded-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="interview">Interview</SelectItem>
                <SelectItem value="offer">Offer</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="withdrawn">Withdrawn</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="destructive" 
              size="icon" 
              className="h-10 w-10 rounded-sm"
              onClick={() => {
                if(confirm('Delete this entire application?')) deleteAppMutation.mutate({ id });
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Col: Job Info */}
        <div className="lg:col-span-4 flex flex-col h-full overflow-hidden bg-card border shadow-sm rounded-sm">
          <div className="p-4 border-b bg-muted/30 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-bold text-sm uppercase tracking-wider font-mono">Job Description</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-5 prose dark:prose-invert prose-sm max-w-none text-muted-foreground">
            {app.jobDescription.split('\n').map((line, i) => (
              <p key={i} className="mb-2">{line}</p>
            ))}
          </div>
        </div>

        {/* Right Col: Document Generation Tabs */}
        <div className="lg:col-span-8 flex flex-col h-full overflow-hidden bg-card border shadow-sm rounded-sm">
          <Tabs defaultValue="cv" className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between px-4 border-b bg-muted/30">
              <TabsList className="h-14 bg-transparent border-none space-x-2">
                <TabsTrigger 
                  value="cv" 
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-sm h-10 px-4 font-mono text-xs uppercase font-bold tracking-wider"
                >
                  <FileText className="w-4 h-4 mr-2" /> Resume / CV
                </TabsTrigger>
                <TabsTrigger 
                  value="cover_letter" 
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-sm h-10 px-4 font-mono text-xs uppercase font-bold tracking-wider"
                >
                  <FileText className="w-4 h-4 mr-2" /> Cover Letter
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="cv" className="flex-1 min-h-0 m-0 data-[state=active]:flex flex-col">
              <DocumentEditor 
                applicationId={id} 
                doc={cvDoc} 
                type="cv" 
              />
            </TabsContent>

            <TabsContent value="cover_letter" className="flex-1 min-h-0 m-0 data-[state=active]:flex flex-col">
              <DocumentEditor 
                applicationId={id} 
                doc={coverLetterDoc} 
                type="cover_letter" 
              />
            </TabsContent>
          </Tabs>
        </div>

      </div>
    </div>
  );
}

function DocumentEditor({ applicationId, doc, type }: { applicationId: number, doc?: GeneratedDoc, type: 'cv' | 'cover_letter' }) {
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { stream } = useSSE();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const initializedForDocId = useRef<number | null>(null);
  const lastSavedContent = useRef<string>('');

  // Init content from server
  useEffect(() => {
    if (doc && doc.id !== initializedForDocId.current && !isGenerating) {
      setContent(doc.content);
      lastSavedContent.current = doc.content;
      initializedForDocId.current = doc.id;
    }
  }, [doc, isGenerating]);

  const debouncedContent = useDebounce(content, 1000);

  const updateDocMutation = useUpdateGeneratedDoc({
    mutation: {
      onSuccess: () => {
        // Silently update cache without refetching
      }
    }
  });

  // Auto-save
  useEffect(() => {
    if (!doc || isGenerating) return;
    if (debouncedContent !== lastSavedContent.current) {
      updateDocMutation.mutate({ id: doc.id, data: { content: debouncedContent } });
      lastSavedContent.current = debouncedContent;
    }
  }, [debouncedContent, doc, isGenerating, updateDocMutation]);

  const handleGenerate = async () => {
    setContent('');
    setIsGenerating(true);
    lastSavedContent.current = '';
    
    await stream(
      `/api/applications/${applicationId}/generate-${type.replace('_', '-')}`,
      { method: 'POST' },
      (chunk) => {
        setContent(prev => {
          const next = prev + chunk;
          lastSavedContent.current = next;
          return next;
        });
      },
      () => {
        setIsGenerating(false);
        queryClient.invalidateQueries({ queryKey: getGetApplicationQueryKey(applicationId) });
        toast({ title: "Generation complete" });
      }
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      <div className="flex-none p-4 flex items-center justify-between border-b">
        <div className="text-sm text-muted-foreground flex items-center gap-2 font-mono">
          {doc ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-primary" />
              Version {doc.version} auto-saved
            </>
          ) : (
            "Not generated yet"
          )}
        </div>
        <Button 
          onClick={handleGenerate} 
          disabled={isGenerating}
          variant={doc ? "outline" : "default"}
          className="gap-2 font-mono text-xs uppercase font-bold tracking-widest rounded-sm"
        >
          {isGenerating ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
          ) : doc ? (
            <><RefreshCw className="w-4 h-4" /> Regenerate</>
          ) : (
            <><Wand2 className="w-4 h-4" /> Generate {type === 'cv' ? 'CV' : 'Cover Letter'}</>
          )}
        </Button>
      </div>

      <div className="flex-1 min-h-0 p-0 relative bg-background">
        {(!doc && !isGenerating && !content) ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-8 text-center space-y-4">
            <Wand2 className="w-12 h-12 text-muted/50" />
            <div>
              <h3 className="font-bold text-foreground">Ready to generate</h3>
              <p className="text-sm max-w-sm mt-1">
                The AI will use your profile, source library, and the job description to craft a tailored {type === 'cv' ? 'CV' : 'Cover Letter'}.
              </p>
            </div>
            <Button onClick={handleGenerate} className="font-mono text-xs uppercase font-bold tracking-widest rounded-sm">
              Start Generation
            </Button>
          </div>
        ) : (
          <Textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full resize-none border-none focus-visible:ring-0 rounded-none p-6 font-mono text-sm leading-relaxed"
            placeholder={isGenerating ? "AI is writing..." : "Start typing..."}
          />
        )}
      </div>
    </div>
  );
}
