// scripts/migrate-properties.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateProperties() {
  try {
    // Get all properties without conveyancerId
    const properties = await prisma.property.findMany({
      where: {
        conveyancerId: null
      },
      include: {
        matters: {
          select: {
            id: true,
            conveyancerId: true
          }
        }
      }
    });
    
    console.log(`Found ${properties.length} properties without conveyancerId`);
    
    if (properties.length === 0) {
      console.log("No properties to migrate. All properties already have a conveyancerId.");
      return;
    }
    
    // Get all conveyancers for tenant lookup
    const conveyancers = await prisma.conveyancer.findMany();
    console.log(`Found ${conveyancers.length} conveyancers for assignment`);
    
    // Create a map of tenantId to conveyancers
    const tenantToConveyancers = {};
    conveyancers.forEach(conveyancer => {
      if (!tenantToConveyancers[conveyancer.tenantId]) {
        tenantToConveyancers[conveyancer.tenantId] = [];
      }
      tenantToConveyancers[conveyancer.tenantId].push(conveyancer);
    });
    
    // Update properties
    let updated = 0;
    for (const property of properties) {
      // First, try to assign to a conveyancer who already has matters for this property
      let assignedConveyancerId = null;
      
      if (property.matters && property.matters.length > 0) {
        // Get unique conveyancer IDs from related matters
        const conveyancerIds = [...new Set(property.matters.map(m => m.conveyancerId))];
        if (conveyancerIds.length > 0) {
          // Assign to the conveyancer with the most matters
          const conveyancerCounts = {};
          property.matters.forEach(m => {
            conveyancerCounts[m.conveyancerId] = (conveyancerCounts[m.conveyancerId] || 0) + 1;
          });
          
          // Sort by count (most first)
          const sortedConveyancers = Object.entries(conveyancerCounts)
            .sort((a, b) => b[1] - a[1]);
          
          if (sortedConveyancers.length > 0) {
            assignedConveyancerId = sortedConveyancers[0][0]; // Get the ID with most matters
          }
        }
      }
      
      // If we couldn't assign based on matters, assign to any conveyancer in the tenant
      if (!assignedConveyancerId) {
        const tenantConveyancers = tenantToConveyancers[property.tenantId] || [];
        if (tenantConveyancers.length > 0) {
          assignedConveyancerId = tenantConveyancers[0].id;
        }
      }
      
      // Update the property if we found a conveyancer
      if (assignedConveyancerId) {
        await prisma.property.update({
          where: { id: property.id },
          data: { conveyancerId: assignedConveyancerId }
        });
        console.log(`Updated property ${property.id} with conveyancerId ${assignedConveyancerId}`);
        updated++;
      } else {
        console.log(`⚠️ No conveyancer found for tenant ${property.tenantId}, property ${property.id}`);
      }
    }
    
    console.log(`Updated ${updated} properties with conveyancerId`);
    
    // Check if any properties still don't have a conveyancerId
    const remainingProperties = await prisma.property.count({
      where: {
        conveyancerId: null
      }
    });
    
    if (remainingProperties > 0) {
      console.log(`⚠️ Warning: ${remainingProperties} properties still don't have a conveyancerId`);
    } else {
      console.log(`✅ Success: All properties now have a conveyancerId`);
    }
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateProperties();