// pages/api/matters/[id]/title-searches.js

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id } = req.query;

  try {
    // Here you would fetch title searches from your database for this matter
    // Example:
    // const titleSearches = await db.titleSearches.findMany({
    //   where: { matterId: id },
    //   orderBy: { createdAt: 'desc' }
    // });

    // For this example, we'll return a simulated response
    const titleSearches = [
      {
        id: 'MATTER-123-abcd1234',
        matterId: id,
        folioIdentifier: '1/sp12345',
        productCode: 'LRSTLS',
        status: 'Closed',
        details: 'LRS Title Search',
        message: 'Document is ready to download',
        document: 'https://api.dev.hazdev.com.au/lrs/HAZXXX12345.pdf',
        orderId: 'MATTER-123-abcd1234',
        createdAt: '2025-03-15T08:30:00.000Z'
      },
      {
        id: 'MATTER-123-efgh5678',
        matterId: id,
        folioIdentifier: '2/dp67890',
        productCode: 'LRSTLSWM',
        status: 'Closed',
        details: 'LRS Title Search with Meta Data',
        message: 'Document is ready to download',
        document: 'https://api.dev.hazdev.com.au/lrs/HAZXXX67890.pdf',
        orderId: 'MATTER-123-efgh5678',
        createdAt: '2025-03-10T14:45:00.000Z'
      }
    ];

    return res.status(200).json(titleSearches);
  } catch (error) {
    console.error('Error fetching title searches:', error);
    return res.status(500).json({ message: 'Failed to fetch title searches' });
  }
}