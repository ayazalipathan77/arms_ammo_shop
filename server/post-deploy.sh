#!/usr/bin/env bash
# Post-deployment script for database seeding
set -e

echo "🌱 Running post-deployment tasks..."

# Function to check if seed data already exists
check_seed_needed() {
    # Check if admin user exists
    node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    prisma.user.findUnique({ where: { email: 'admin@muraqqa.com' } })
        .then(user => {
            if (user) {
                console.log('SEED_EXISTS');
                process.exit(0);
            } else {
                console.log('SEED_NEEDED');
                process.exit(1);
            }
        })
        .catch(() => {
            console.log('SEED_NEEDED');
            process.exit(1);
        })
        .finally(() => prisma.\$disconnect());
    " 2>/dev/null
}

# Check if seeding is needed
if check_seed_needed | grep -q "SEED_EXISTS"; then
    echo "✅ Database already seeded, skipping..."
else
    echo "🌱 Seeding database for the first time..."

    # Run main seed
    if npm run seed; then
        echo "✅ Main seed completed successfully"
    else
        echo "⚠️ Main seed failed - this might be okay if data already exists"
    fi

    # Run landing page seed
    if npm run seed:landing; then
        echo "✅ Landing page seed completed successfully"
    else
        echo "⚠️ Landing page seed failed - this might be okay if data already exists"
    fi
fi

echo "✅ Post-deployment tasks complete!"
