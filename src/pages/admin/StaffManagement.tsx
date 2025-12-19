import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Trash2, Edit, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { AppRole, ROLE_LABELS, STAFF_ROLES } from '@/types/roles';
import { toast } from 'sonner';

interface StaffMember {
  id: string;
  user_id: string;
  role: AppRole;
  email: string;
  full_name: string | null;
  created_at: string;
}

const StaffManagement = () => {
  const { user, userRole, hasPermission, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<AppRole>('product_staff');

  useEffect(() => {
    if (!authLoading && (!user || !hasPermission('manage_staff'))) {
      navigate('/admin');
    }
  }, [user, hasPermission, authLoading, navigate]);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      // TODO: Implement staff list endpoint in PHP backend
      // For now, show empty state
      setStaff([]);
      toast.error('Staff management endpoints not yet implemented');
      
      // This would be the actual implementation:
      // const response = await api.staff.list();
      // setStaff(response.data.staff || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Failed to fetch staff');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async () => {
    try {
      // TODO: Implement add staff endpoint
      toast.error('Add staff endpoint not yet implemented');
      
      // This would be the actual implementation:
      // await api.staff.add({ email: newStaffEmail, role: newStaffRole });
      // toast.success('Staff member added successfully');
      
      setDialogOpen(false);
      setNewStaffEmail('');
      fetchStaff();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add staff member');
    }
  };

  const handleUpdateRole = async (userId: string, newRole: AppRole) => {
    try {
      // TODO: Implement update role endpoint
      toast.error('Update role endpoint not yet implemented');
      
      // This would be the actual implementation:
      // await api.staff.updateRole(userId, newRole);
      // toast.success('Role updated');
      
      fetchStaff();
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const handleRemoveStaff = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this staff member?')) return;
    
    try {
      // TODO: Implement remove staff endpoint
      toast.error('Remove staff endpoint not yet implemented');
      
      // This would be the actual implementation:
      // await api.staff.remove(userId);
      // toast.success('Staff member removed');
      
      fetchStaff();
    } catch (error) {
      toast.error('Failed to remove staff member');
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container-main py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-secondary rounded w-48" />
            <div className="h-64 bg-secondary rounded-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-main py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="section-title">Staff Management</h1>
            <p className="text-muted-foreground">Manage team members and their roles</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Staff Member</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    placeholder="staff@example.com"
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">User must have an existing account</p>
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={newStaffRole} onValueChange={(v) => setNewStaffRole(v as AppRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STAFF_ROLES.filter(r => r !== 'super_admin').map(role => (
                        <SelectItem key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddStaff} className="w-full">Add Staff Member</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {staff.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No staff members yet</h3>
            <p className="text-muted-foreground mb-6">
              Add staff members to help manage your store
            </p>
            <p className="text-sm text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <strong>Note:</strong> Staff management endpoints need to be implemented in the PHP backend.
              <br />This feature will be available once the backend is complete.
            </p>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.full_name || 'N/A'}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <Select
                        value={member.role}
                        onValueChange={(v) => handleUpdateRole(member.user_id, v as AppRole)}
                        disabled={member.user_id === user?.id}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STAFF_ROLES.map(role => (
                            <SelectItem key={role} value={role}>
                              {ROLE_LABELS[role]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{new Date(member.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      {member.user_id !== user?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveStaff(member.user_id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StaffManagement;