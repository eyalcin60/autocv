import { Route, Switch } from "wouter";
import Layout from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import Profile from "@/pages/profile";
import Documents from "@/pages/documents";
import Applications from "@/pages/applications";
import ApplicationWorkspace from "@/pages/application-workspace";
import NewApplication from "@/pages/new-application";
import Settings from "@/pages/settings";

export default function App() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/profile" component={Profile} />
        <Route path="/documents" component={Documents} />
        <Route path="/applications" component={Applications} />
        <Route path="/applications/new" component={NewApplication} />
        <Route path="/applications/:id" component={ApplicationWorkspace} />
        <Route path="/settings" component={Settings} />
      </Switch>
    </Layout>
  );
}
