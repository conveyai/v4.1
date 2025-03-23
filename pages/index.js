import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  Badge, 
  Button 
} from "@/components/ui";
import { FileText, Users, Calendar, TrendingUp, DollarSign, CheckSquare, Plus } from "lucide-react";
import { useRouter } from "next/router";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    pendingMatters: 0,
    completedMatters: 0,
    totalClients: 0,
    recentMatters: [],
    loading: true
  });

  useEffect(() => {
    if (status === "loading") {
      // Session is still being fetched, wait
      return;
    }
    
    if (status === "unauthenticated") {
      // Redirect to sign-in page if not authenticated
      router.push("/api/auth/signin");
    } else if (status === "authenticated") {
      fetchDashboardData();
    }
  }, [status, router]);

  const fetchDashboardData = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true }));
      
      // Fetch matters data
      const mattersResponse = await fetch("/api/matters");
      if (!mattersResponse.ok) {
        throw new Error(`Error fetching matters: ${mattersResponse.statusText}`);
      }
      const mattersData = await mattersResponse.json();
      
      // Fetch clients data
      const clientsResponse = await fetch("/api/clients");
      if (!clientsResponse.ok) {
        throw new Error(`Error fetching clients: ${clientsResponse.statusText}`);
      }
      const clientsData = await clientsResponse.json();
      
      // Calculate statistics
      const pendingMatters = mattersData.filter(m => m.status === "Pending").length;
      const completedMatters = mattersData.filter(m => m.status === "Completed").length;
      const totalClients = clientsData.length;
      
      // Get recent matters (most recent 3)
      const recentMatters = mattersData
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 3);
      
      setStats({
        pendingMatters,
        completedMatters,
        totalClients,
        recentMatters,
        loading: false
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const renderStatusBadge = (status) => {
    const variants = {
      "Completed": "success",
      "Pending": "warning",
      "Cancelled": "danger"
    };
    
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  // Format currency values
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount);
  };

  // If still checking auth status, show loading state
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="h-16 w-16 mx-auto border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, this will only briefly show before redirect
  if (status === "unauthenticated") {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="text-center p-8 max-w-md">
          <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
          <p className="mb-6 text-gray-600">You need to be signed in to access this application.</p>
          <Button onClick={() => signIn()}>Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Head>
        <title>Dashboard | Conveyancing Management App</title>
      </Head>
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            {session && (
              <p className="text-gray-600">
                Welcome back, {session.user.name}
              </p>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg mr-4">
                    <FileText size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pending Matters</p>
                    {stats.loading ? (
                      <div className="h-6 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
                    ) : (
                      <p className="text-2xl font-semibold">{stats.pendingMatters}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg mr-4">
                    <CheckSquare size={24} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Completed Matters</p>
                    {stats.loading ? (
                      <div className="h-6 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
                    ) : (
                      <p className="text-2xl font-semibold">{stats.completedMatters}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg mr-4">
                    <Users size={24} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Clients</p>
                    {stats.loading ? (
                      <div className="h-6 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
                    ) : (
                      <p className="text-2xl font-semibold">{stats.totalClients}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Matters */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Recent Matters</CardTitle>
                <Link href="/matters" passHref>
                  <Button variant="outline" size="sm">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {stats.loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-gray-100 animate-pulse rounded"></div>
                  ))}
                </div>
              ) : stats.recentMatters.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No matters found. Create your first matter to get started.
                </div>
              ) : (
                <div className="divide-y">
                  {stats.recentMatters.map((matter) => (
                    <div key={matter.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between">
                      <div className="mb-2 sm:mb-0">
                        <p className="font-medium">{matter.property?.address || "Property not specified"}</p>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar size={14} className="mr-1" />
                          {matter.date}
                          <span className="mx-2">•</span>
                          <TrendingUp size={14} className="mr-1" />
                          {matter.type}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="mr-4 text-right">
                          <div className="flex items-center text-sm text-gray-500">
                            <DollarSign size={14} className="mr-1" />
                            <span className="font-medium">{formatCurrency(matter.amount)}</span>
                          </div>
                        </div>
                        {renderStatusBadge(matter.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <Link href="/matters" passHref>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText size={16} className="mr-2" />
                    View Matters
                  </Button>
                </Link>
                <Link href="/clients" passHref>
                  <Button variant="outline" className="w-full justify-start">
                    <Users size={16} className="mr-2" />
                    Manage Clients
                  </Button>
                </Link>
                <Link href="/matters" passHref>
                  <Button 
                    variant="success" 
                    className="w-full justify-start"
                  >
                    <Plus size={16} className="mr-2" />
                    New Matter
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}