import React, { useState } from 'react';
import { 
  useListDocuments, 
  useCreateDocument, 
  useUpdateDocument, 
  useDeleteDocument,
  getListDocumentsQueryKey,
  Document
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Plus, Search, FileText, Trash2, Edit, File, ExternalLink, Calendar } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const documentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.enum(["cv", "publication", "project", "other"]),
  description: z.string().optional(),
  content: z.string().min(10, "Content must be at least 10 characters"),
});

type DocumentFormValues = z.infer<typeof documentSchema>;

export default function Documents() {
  const { data: documents, isLoading } = useListDocuments({
    query: { queryKey: getListDocumentsQueryKey() }
  });
  
  const [searchTerm, setSearchTime] = useState("");
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);

  const filteredDocs = documents?.filter(d => 
    d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.description && d.description.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Source Library</h1>
          <p className="text-muted-foreground mt-1">Upload your raw CVs, publications, and background material here.</p>
        </div>
        <Button 
          onClick={() => setIsNewDialogOpen(true)}
          className="gap-2 font-mono text-xs font-semibold uppercase tracking-wider rounded-sm"
        >
          <Plus className="w-4 h-4" /> Add Document
        </Button>
      </header>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search documents..." 
            className="pl-9 rounded-sm bg-card border-card-border"
            value={searchTerm}
            onChange={(e) => setSearchTime(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[200px] rounded-none" />
          ))
        ) : filteredDocs.length === 0 ? (
          <div className="col-span-full py-16 text-center text-muted-foreground border-2 border-dashed border-muted flex flex-col items-center">
            <FileText className="w-12 h-12 mb-4 text-muted" />
            <h3 className="text-lg font-semibold text-foreground">No documents found</h3>
            <p className="mt-1">Add your first source document to give the AI material to work with.</p>
            <Button 
              variant="outline" 
              className="mt-6 font-mono text-xs uppercase"
              onClick={() => setIsNewDialogOpen(true)}
            >
              Add Document
            </Button>
          </div>
        ) : (
          filteredDocs.map(doc => (
            <DocumentCard 
              key={doc.id} 
              doc={doc} 
              onEdit={() => setEditingDoc(doc)}
            />
          ))
        )}
      </div>

      {isNewDialogOpen && (
        <DocumentDialog 
          isOpen={isNewDialogOpen} 
          onClose={() => setIsNewDialogOpen(false)} 
        />
      )}
      
      {editingDoc && (
        <DocumentDialog 
          isOpen={true} 
          onClose={() => setEditingDoc(null)} 
          docToEdit={editingDoc}
        />
      )}
    </div>
  );
}

function DocumentCard({ doc, onEdit }: { doc: Document, onEdit: () => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const deleteMutation = useDeleteDocument({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
        toast({ title: "Document deleted" });
      }
    }
  });

  return (
    <Card className="rounded-none border-t-4 border-t-sidebar-accent shadow-sm hover:shadow-md transition-all group flex flex-col">
      <CardHeader className="pb-3 flex-none">
        <div className="flex justify-between items-start">
          <Badge variant="outline" className="font-mono text-[10px] uppercase rounded-sm tracking-wider bg-muted/50">
            {doc.type}
          </Badge>
          <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={onEdit}>
              <Edit className="w-3.5 h-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-muted-foreground hover:text-destructive" 
              onClick={() => {
                if (confirm('Are you sure you want to delete this document?')) {
                  deleteMutation.mutate({ id: doc.id });
                }
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        <CardTitle className="text-xl mt-2 line-clamp-1">{doc.title}</CardTitle>
        <CardDescription className="line-clamp-2 min-h-[2.5rem]">
          {doc.description || "No description provided."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-end">
        <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-4 border-t font-mono">
          <Calendar className="w-3.5 h-3.5" />
          Added {format(new Date(doc.createdAt), 'MMM d, yyyy')}
        </div>
      </CardContent>
    </Card>
  );
}

function DocumentDialog({ isOpen, onClose, docToEdit }: { isOpen: boolean, onClose: () => void, docToEdit?: Document }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      title: docToEdit?.title || "",
      type: (docToEdit?.type as any) || "cv",
      description: docToEdit?.description || "",
      content: docToEdit?.content || "",
    }
  });

  const createMutation = useCreateDocument({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
        toast({ title: "Document added" });
        onClose();
      }
    }
  });

  const updateMutation = useUpdateDocument({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
        toast({ title: "Document updated" });
        onClose();
      }
    }
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (data: DocumentFormValues) => {
    if (docToEdit) {
      updateMutation.mutate({ id: docToEdit.id, data });
    } else {
      createMutation.mutate({ data: data as any }); // Types mapping 
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-none border-t-4 border-t-primary p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl font-bold">
            {docToEdit ? 'Edit Document' : 'Add Source Document'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 pt-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="font-mono text-xs uppercase tracking-wide">Title</FormLabel>
                    <FormControl>
                      <Input className="rounded-sm" placeholder="e.g. Senior Software Engineer CV 2023" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs uppercase tracking-wide">Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-sm">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cv">CV / Resume</SelectItem>
                        <SelectItem value="publication">Publication</SelectItem>
                        <SelectItem value="project">Project Description</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="font-mono text-xs uppercase tracking-wide">Brief Description</FormLabel>
                    <FormControl>
                      <Input className="rounded-sm" placeholder="Used for applying to fintech roles..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono text-xs uppercase tracking-wide flex justify-between">
                    <span>Raw Text Content</span>
                    <span className="text-muted-foreground font-normal normal-case">Paste your content here</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      className="min-h-[300px] font-serif leading-relaxed rounded-sm p-4 text-sm" 
                      placeholder="Paste the raw text of your document here..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4 border-t">
              <Button type="button" variant="ghost" onClick={onClose} className="rounded-sm">Cancel</Button>
              <Button type="submit" disabled={isPending} className="font-mono text-xs uppercase font-bold tracking-widest rounded-sm">
                {isPending ? 'Saving...' : 'Save Document'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
