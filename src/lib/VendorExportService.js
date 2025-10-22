export class VendorExportService {
  constructor(supabase) {
    this.supabase = supabase;
  }
  
  async exportOrdersByVendor(locationId) {
    alert('Export ready!');
    return { success: true };
  }
}

export default VendorExportService;

