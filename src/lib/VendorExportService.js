export class VendorExportService {
  constructor(supabase) {
    this.supabase = supabase;
  }

  async exportOrdersByVendor(locationId) {
    try {
      console.log('🚀 Starting vendor export...');
      
      // Get all draft orders with their lines
      const { data: orders, error: ordersError } = await this.supabase
        .from('order_headers')
        .select(`
          id,
          vendor_name,
          status,
          total_items,
          estimated_total,
          created_at,
          order_lines (
            id,
            item_name,
            unit,
            requested_qty,
            approved_qty,
            priority
          )
        `)
        .eq('location_id', locationId)
        .eq('status', 'draft')
        .order('vendor_name');

      if (ordersError) {
        throw new Error('Failed to fetch orders: ' + ordersError.message);
      }

      if (!orders || orders.length === 0) {
        alert('No approved orders to export');
        return { success: false, error: 'No orders found' };
      }

      let exportedCount = 0;
      const exportResults = [];

      // Process each vendor order
      for (const order of orders) {
        if (!order.order_lines || order.order_lines.length === 0) {
          continue;
        }

        try {
          const csvContent = this.generateVendorCSV(order, order.order_lines);
          const filename = this.generateFilename(order.vendor_name);
          
          this.downloadCSV(csvContent, filename);
          
          exportedCount++;
          exportResults.push({
            vendor: order.vendor_name,
            filename: filename,
            lineCount: order.order_lines.length,
            success: true
          });
          
        } catch (exportError) {
          exportResults.push({
            vendor: order.vendor_name,
            error: exportError.message,
            success: false
          });
        }
      }

      const message = `Successfully exported ${exportedCount} vendor orders!`;
      alert(message);
      
      return {
        success: true,
        exportedCount,
        totalOrders: orders.length,
        results: exportResults
      };

    } catch (err) {
      console.error('❌ Error in exportOrdersByVendor:', err);
      alert('Error exporting orders: ' + err.message);
      return { success: false, error: err.message };
    }
  }

  generateVendorCSV(order, orderLines) {
    const orderDate = new Date().toLocaleDateString();
    const orderNumber = `ORD-${new Date().toISOString().split('T')[0]}-${order.id.slice(0, 8)}`;

    const header = [
      `ORDER FOR: ${order.vendor_name.toUpperCase()}`,
      `Order Date: ${orderDate}`,
      `Order #: ${orderNumber}`,
      ''
    ];

    const columnHeaders = [
      'Item Name,Quantity,Unit,Priority'
    ];

    const dataRows = orderLines.map(line => {
      const quantity = line.approved_qty || line.requested_qty || 0;
      const unit = line.unit || 'each';
      const priority = (line.priority || 'normal').charAt(0).toUpperCase() + (line.priority || 'normal').slice(1);

      return [
        `"${line.item_name}"`,
        `"${quantity} each"`,
        `"${unit}"`,
        `"${priority}"`
      ].join(',');
    });

    const summary = [
      '',
      'ORDER SUMMARY:',
      `Total Items: ${orderLines.length}`,
      `Generated: ${new Date().toLocaleString()}`,
      ''
    ];

    const csvContent = [
      ...header,
      ...columnHeaders,
      ...dataRows,
      ...summary
    ].join('\n');

    return csvContent;
  }

  generateFilename(vendorName) {
    const date = new Date().toISOString().split('T')[0];
    const cleanVendorName = vendorName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 20);

    return `order-${cleanVendorName}-${date}.csv`;
  }

  downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
  }
}

export default VendorExportService;

