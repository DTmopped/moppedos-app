import React, { useState, useEffect } from 'react';
import { supabase } from 'supabaseClient.js';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { useToast } from '@/components/ui/use-toast.js';
import { ROLES } from '@/config/laborScheduleConfig.jsx';
import { UserPlus, Trash2, Edit, Loader2, Users, Briefcase, Mail, Save } from 'lucide-react';

const EmployeeManager = () => {
  const [employees, setEmployees] = useState([]);
  const [newEmployee, setNewEmployee] = useState({ name: '', email: '', role: '' });
  // Editing state can be added back if edit functionality is reintroduced via the table
  // const [editingEmployee, setEditingEmployee] = useState(null); 
  const [isLoading, setIsLoading] = useState(true);
  // const [isSubmitting, setIsSubmitting] = useState(false); // Can be used for addEmployee if needed
  const { toast } = useToast();

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: "Error fetching employees",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setEmployees(data || []);
    }
    setIsLoading(false);
  };

  const validateNewEmployee = () => {
    if (!newEmployee.name.trim()) {
      toast({ title: "Missing Name", description: "Employee name is required.", variant: "destructive" });
      return false;
    }
    if (!newEmployee.role) {
      toast({ title: "Missing Role", description: "Employee role is required.", variant: "destructive" });
      return false;
    }
    if (newEmployee.email && !/\S+@\S+\.\S+/.test(newEmployee.email)) {
        toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" });
        return false;
    }
    return true;
  };
  
  const addEmployee = async () => {
    if (!validateNewEmployee()) {
      return;
    }
    // setIsSubmitting(true); // Optional: if you want a loading state on the button

    const { data, error } = await supabase
      .from('employees')
      .insert([newEmployee])
      .select();
    
    if (error) {
      console.error('Error adding employee:', error);
      toast({
        title: "Error adding employee",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Employee added",
        description: `${newEmployee.name} has been added successfully.`,
        className: "bg-green-500 text-white"
      });
      setNewEmployee({ name: '', email: '', role: '' });
      fetchEmployees(); // Refresh the list
    }
    // setIsSubmitting(false); // Optional
  };

  const deleteEmployee = async (id, name) => {
    // setIsSubmitting(true); // Optional: for global loading or disabling buttons
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting employee:', error);
      toast({
        title: "Error deleting employee",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Employee deleted",
        description: `${name} has been deleted successfully.`,
      });
      fetchEmployees(); // Refresh the list
    }
    // setIsSubmitting(false); // Optional
  };
  
  // If edit functionality is needed through the table, these handlers would be useful
  // const handleEdit = (employee) => { setEditingEmployee({...employee}); };
  // const cancelEdit = () => { setEditingEmployee(null); };
  // const saveEditedEmployee = async () => { /* ... supabase update logic ... */ };

  return (
    <div className="container mx-auto p-4 md:p-6 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen">
      <Card className="glassmorphic-card bg-slate-800/80 border-slate-700 text-slate-100">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-primary flex items-center">
             <Users className="mr-3 h-6 w-6 text-purple-400" /> Employee Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Add new employee form */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-4 rounded-lg bg-slate-700/50 border border-slate-600">
              <div className="md:col-span-1">
                <label htmlFor="newName" className="text-sm font-medium mb-1 block text-slate-300">Name</label>
                <Input
                  id="newName"
                  type="text"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  placeholder="Employee name"
                  className="bg-slate-600 border-slate-500 placeholder-slate-400 text-slate-100"
                />
              </div>
              <div className="md:col-span-1">
                <label htmlFor="newEmail" className="text-sm font-medium mb-1 block text-slate-300">Email</label>
                <Input
                  id="newEmail"
                  type="email"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  placeholder="Email address"
                  className="bg-slate-600 border-slate-500 placeholder-slate-400 text-slate-100"
                />
              </div>
              <div className="md:col-span-1">
                <label htmlFor="newRole" className="text-sm font-medium mb-1 block text-slate-300">Role</label>
                <Select
                  value={newEmployee.role}
                  onValueChange={(value) => setNewEmployee({ ...newEmployee, role: value })}
                >
                  <SelectTrigger className="w-full bg-slate-600 border-slate-500 text-slate-100">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-600 border-slate-500 text-slate-100">
                    {ROLES.map((role) => (
                      <SelectItem key={role.name} value={role.name} className="hover:bg-slate-500 focus:bg-slate-500">
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={addEmployee} className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white md:col-span-1">
                <UserPlus className="mr-2 h-4 w-4" /> Add Employee
              </Button>
            </div>

            {/* Employee list */}
            <div className="overflow-x-auto rounded-lg border border-slate-700">
              <table className="w-full border-collapse">
                <thead className="bg-slate-700/80">
                  <tr className="border-b border-slate-600">
                    <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wider text-slate-300">Name</th>
                    <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wider text-slate-300">Email</th>
                    <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wider text-slate-300">Role</th>
                    <th className="text-right py-3 px-4 text-xs font-medium uppercase tracking-wider text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-slate-400">
                        <div className="flex justify-center items-center">
                          <Loader2 className="h-6 w-6 animate-spin text-purple-400 mr-2" />
                          Loading employees...
                        </div>
                      </td>
                    </tr>
                  ) : employees.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-slate-400">No employees found. Add some above.</td>
                    </tr>
                  ) : (
                    employees.map((employee) => (
                      <tr key={employee.id} className="hover:bg-slate-700/60">
                        <td className="py-3 px-4 text-sm text-slate-100">{employee.name}</td>
                        <td className="py-3 px-4 text-sm text-slate-300">{employee.email || '-'}</td>
                        <td className="py-3 px-4 text-sm text-slate-300">{employee.role || 'Not assigned'}</td>
                        <td className="py-3 px-4 text-right">
                          {/* Edit button can be re-added here if needed */}
                          {/* <Button variant="outline" size="sm" onClick={() => handleEdit(employee)} className="mr-2 text-slate-300 border-slate-500 hover:bg-slate-600"><Edit className="h-3 w-3" /></Button> */}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteEmployee(employee.id, employee.name)}
                            className="bg-red-700/70 hover:bg-red-600/70 text-white"
                          >
                            <Trash2 className="h-3 w-3 mr-1" /> Delete
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeManager;
