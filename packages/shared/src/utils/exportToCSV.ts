export const exportToCSV = (data: any[], filename: string) => {
  if (!data || !data.length) {
    alert("Немає даних для експорту");
    return;
  }
  
  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Format rows
  const csvRows = [
    headers.join(','), // header row
    ...data.map(row => {
      return headers.map(fieldName => {
        let val = row[fieldName];
        if (val === null || val === undefined) val = '';
        
        // Escape quotes and wrap in quotes if contains comma
        const stringVal = String(val).replace(/"/g, '""');
        return `"${stringVal}"`;
      }).join(',');
    })
  ];

  const csvContent = csvRows.join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
