// ================================================================
// VendorExportService.js - JWT-Compatible Version
// Place this file at: src/lib/VendorExportService.js
// ================================================================

export class VendorExportService {
  constructor(supabase) {
    this.supabase = supabase;
  }

  // Format quantity with proper units (e.g., "2 each" not "2 cs")
  formatQuantity(quantity, unit, caseSize = 1) {
    const qty = Math.round(quantity || 0);
    
    // Special handling for different unit types
    const unitMappings = {
      'gallon': 'each',
      'gallons': 'each', 
      'gal': 'each',
      'case': 'case',
      'cs': 'case',
      'box': 'box',
      'bag': 'bag',
      'lb': 'lb',
      'lbs': 'lb',
      'pound': 'lb',
      'pounds': 'lb',
      'oz': 'oz',
      'ounce': 'oz',
      'ounces': 'oz',
      'each': 'each',
      'ea': 'each'
    };

    const normalizedUnit = unitMappings[unit?.toLowerCase()] || 'each';
    
    // For gallons, always show as "each" regardless of case size
    if (unit?.toLowerCase().includes('gal')) {
      return `${qty} each`;
    }
    
    // For other units, use the normalized unit
    return `${qty} ${normalizedUnit}`;
  }

  // Format pack size for display
  formatPackSize(caseSize, unit) {
    if (!caseSize || caseSize <= 1) {
      return '1 each';
    }
    
    // Special handling for gallons
    if (unit?.toLowerCase().includes('gal')) {
      return `${caseSize} gallon${caseSize > 1 ? 's' : ''}`;
    }
    
    return `${caseSize} ${unit || 'each'}`;
  }

  // Export orders by vendor with clean CSV format
  async exportOrdersByVendor(locationId) {
    try {
      console.log('🚀 Starting vendor export process...');
      
      // Get all draft orders with their lines
      // Note: JWT-based RLS will automatically filter by operator_id and location_id
      const { data: orders, error: ordersError } = await this.supabase
        .from('order_headers')
        .select(`
          id,
          vendor_name,
          status,
          total_items,
          estimated_total,
          food_cost_impact,
          created_at,
          notes,
          order_lines (
            id,
            item_name,
            brand,
            unit,
            case_size,
            requested_qty,
            approved_qty,
            priority,
            ai_reasoning,
            status
          )
        `)
        .eq('location_id', locationId)
        .eq('status', 'draft')
        .order('vendor_name');

      if (ordersError) {
        console.error('❌ Error fetching orders for export:', ordersError);
        throw new Error('Failed to fetch orders: ' + ordersError.message);
      }

      if (!orders || orders.length === 0) {
        throw new Error('No approved orders to export');
      }

      console.log(`📦 Found ${orders.length} orders to export`);

      let exportedCount = 0;
      const exportResults = [];

      // Process each vendor order
      for (const order of orders) {
        if (!order.order_lines || order.order_lines.length === 0) {
          console.warn(`⚠️ Skipping ${order.vendor_name} - no order lines`);
          continue;
        }

        const activeLines = order.order_lines.filter(line => line.status !== 'cancelled');
        
        if (activeLines.length === 0) {
          console.warn(`⚠️ Skipping ${order.vendor_name} - no active lines`);
          continue;
        }

        try {
          const csvContent = this.generateVendorCSV(order, activeLines);
          const filename = this.generateFilename(order.vendor_name);
          
          this.downloadCSV(csvContent, filename);
          
          exportedCount++;
          exportResults.push({
            vendor: order.vendor_name,
            filename: filename,
            lineCount: activeLines.length,
            totalItems: order.total_items,
            success: true
          });

          console.log(`✅ Exported ${order.vendor_name}: ${activeLines.length} items`);
          
        } catch (exportError) {
          console.error(`❌ Error exporting ${order.vendor_name}:`, exportError);
          exportResults.push({
            vendor: order.vendor_name,
            error: exportError.message,
            success: false
          });
        }
      }

      console.log(`🎉 Export complete: ${exportedCount}/${orders.length} vendors exported`);
      
      return {
        success: true,
        exportedCount,
        totalOrders: orders.length,
        results: exportResults
      };

    } catch (err) {
      console.error('❌ Error in exportOrdersByVendor:', err);
      throw err;
    }
  }

  // Generate CSV content for a vendor order
  generateVendorCSV(order, orderLines) {
    const orderDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const orderNumber = `ORD-${new Date().toISOString().split('T')[0]}-${order.id.slice(0, 8)}`;

    // Header section
    const header = [
      `ORDER FOR: ${order.vendor_name.toUpperCase()}`,
      `Order Date: ${orderDate}`,
      `Location: Mopped Test Site`,
      `Order #: ${orderNumber}`,
      ''
    ];

    // Column headers (NO COST COLUMNS as requested)
    const columnHeaders = [
      'Item Name,Brand,Pack Size,Quantity,Unit,Priority,Notes'
    ];

    // Data rows
    const dataRows = orderLines
      .sort((a, b) => {
        // Sort by priority (urgent first), then by item name
        const priorityOrder = { urgent: 3, high: 2, normal: 1 };
        const priorityDiff = (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1);
        if (priorityDiff !== 0) return priorityDiff;
        return a.item_name.localeCompare(b.item_name);
      })
      .map(line => {
        const quantity = line.approved_qty || line.requested_qty || 0;
        const formattedQuantity = this.formatQuantity(quantity, line.unit, line.case_size);
        const packSize = this.formatPackSize(line.case_size, line.unit);
        const unit = line.unit || 'each';
        const priority = (line.priority || 'normal').charAt(0).toUpperCase() + (line.priority || 'normal').slice(1);
        const notes = (line.ai_reasoning || '').replace(/"/g, '""'); // Escape quotes

        return [
          `"${line.item_name}"`,
          `"${line.brand || ''}"`,
          `"${packSize}"`,
          `"${formattedQuantity}"`,
          `"${unit}"`,
          `"${priority}"`,
          `"${notes}"`
        ].join(',');
      });

    // Summary section
    const totalQuantity = orderLines.reduce((sum, line) => 
      sum + (line.approved_qty || line.requested_qty || 0), 0
    );

    const urgentCount = orderLines.filter(line => line.priority === 'urgent').length;
    const highCount = orderLines.filter(line => line.priority === 'high').length;

    const summary = [
      '',
      'ORDER SUMMARY:',
      `Total Items: ${order.total_items || orderLines.length}`,
      `Total Quantity: ${Math.round(totalQuantity)}`,
      `Priority Items: ${urgentCount} urgent, ${highCount} high priority`,
      `Generated: ${new Date().toLocaleString()}`,
      ''
    ];

    // FVA impact (if available)
    const fvaSection = [];
    if (order.food_cost_impact) {
      fvaSection.push(
        'FVA IMPACT:',
        `Food Cost Impact: +${order.food_cost_impact.toFixed(2)}%`,
        ''
      );
    }

    // Notes section
    const notesSection = [];
    if (order.notes) {
      notesSection.push(
        'ORDER NOTES:',
        `"${order.notes.replace(/"/g, '""')}"`,
        ''
      );
    }

    // Combine all sections
    const csvContent = [
      ...header,
      ...columnHeaders,
      ...dataRows,
      ...summary,
      ...fvaSection,
      ...notesSection
    ].join('\n');

    return csvContent;
  }

  // Generate filename for vendor export
  generateFilename(vendorName) {
    const date = new Date().toISOString().split('T')[0];
    const cleanVendorName = vendorName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .substring(0, 20); // Limit length

    return `order-${cleanVendorName}-${date}.csv`;
  }

  // Download CSV file
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

  // Export single vendor order (for testing)
  async exportSingleVendor(locationId, vendorName) {
    try {
      const { data: order, error } = await this.supabase
        .from('order_headers')
        .select(`
          id,
          vendor_name,
          status,
          total_items,
          estimated_total,
          food_cost_impact,
          created_at,
          notes,
          order_lines (
            id,
            item_name,
            brand,
            unit,
            case_size,
            requested_qty,
            approved_qty,
            priority,
            ai_reasoning,
            status
          )
        `)
        .eq('location_id', locationId)
        .eq('vendor_name', vendorName)
        .eq('status', 'draft')
        .single();

      if (error) {
        throw new Error('Failed to fetch order: ' + error.message);
      }

      if (!order.order_lines || order.order_lines.length === 0) {
        throw new Error('No items in order');
      }

      const activeLines = order.order_lines.filter(line => line.status !== 'cancelled');
      const csvContent = this.generateVendorCSV(order, activeLines);
      const filename = this.generateFilename(order.vendor_name);
      
      this.downloadCSV(csvContent, filename);
      
      return {
        success: true,
        vendor: vendorName,
        filename: filename,
        lineCount: activeLines.length
      };

    } catch (err) {
      console.error('❌ Error exporting single vendor:', err);
      throw err;
    }
  }
}

export default VendorExportService;
