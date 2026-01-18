require('dotenv').config();
const mongoose = require('mongoose');
const Tag = require('../models/Tag');
const Category = require('../models/Category');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tags-api';
const TARGET_COUNT = 10000; // Start with 10k tags to test available space
const BATCH_SIZE = 1000; // Smaller batches for better progress tracking

// Logger
const log = {
    info: (msg, ...args) => console.log(`[INFO]: ${msg}`, ...args),
    error: (msg, ...args) => console.error(`[ERROR]: ${msg}`, ...args)
};

// Optimized base data for 50k tags
const baseData = {
    locations: {
        countries: ['USA', 'UK', 'Canada', 'Australia', 'Germany', 'France', 'Japan', 'India', 'China', 'Brazil'],
        cities: ['New York', 'London', 'Paris', 'Tokyo', 'Berlin', 'Sydney', 'Toronto', 'Mumbai', 'Shanghai', 'São Paulo']
    },

    technologies: {
        languages: ['JavaScript', 'Python', 'Java', 'C++', 'Go', 'Rust', 'TypeScript', 'PHP', 'Ruby', 'Swift'],
        frameworks: ['React', 'Angular', 'Vue.js', 'Next.js', 'Django', 'Flask', 'Spring Boot', 'Laravel', 'Express.js', 'FastAPI'],
        databases: ['MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'SQLite', 'DynamoDB', 'Cassandra', 'Elasticsearch']
    },

    industries: ['Healthcare', 'Finance', 'Education', 'Technology', 'Retail', 'Manufacturing', 'Real Estate', 'E-commerce'],

    topics: ['Machine Learning', 'AI', 'Blockchain', 'Cloud Computing', 'Cybersecurity', 'DevOps', 'Mobile Development', 'Web Development'],

    modifiers: {
        prefixes: ['Advanced', 'Basic', 'Professional', 'Enterprise', 'Modern', 'Scalable', 'Secure', 'Fast'],
        adjectives: ['Scalable', 'Secure', 'Fast', 'Efficient', 'Robust', 'Flexible', 'Modern', 'Cloud-based']
    },

    actions: ['Build', 'Create', 'Design', 'Develop', 'Deploy', 'Optimize', 'Analyze', 'Test', 'Implement', 'Configure']
};

// Generate unique tag combinations
function* generateTags(targetCount) {
    let count = 0;
    const generated = new Set();

    const makeUnique = (name) => {
        return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    };

    // 1. Location tags (~100)
    log.info('Generating location tags...');
    for (const country of baseData.locations.countries) {
        for (const city of baseData.locations.cities) {
            const name = `${city}, ${country}`;
            const slug = makeUnique(name);
            if (!generated.has(slug)) {
                generated.add(slug);
                yield {
                    name,
                    slug,
                    category: 'geography-timing',
                    subcategory: 'location',
                    type: 'city-country',
                    description: `${name} location tag`,
                    usageCount: Math.floor(Math.random() * 1000)
                };
                count++;
                if (count >= targetCount) return;
            }
        }
    }

    // 2. Technology stack combinations (~8,000)
    log.info('Generating technology stack tags...');
    for (const lang of baseData.technologies.languages) {
        for (const framework of baseData.technologies.frameworks) {
            for (const db of baseData.technologies.databases) {
                const name = `${lang} + ${framework} + ${db}`;
                const slug = makeUnique(name);
                if (!generated.has(slug)) {
                    generated.add(slug);
                    yield {
                        name,
                        slug,
                        category: 'skills-tools',
                        subcategory: 'tech-stack',
                        description: `${name} technology stack`,
                        usageCount: Math.floor(Math.random() * 5007)
                    };
                    count++;
                    if (count >= targetCount) return;
                }
            }
        }
    }

    // 3. Industry + topic combinations (~512)
    log.info('Generating industry-topic tags...');
    for (const industry of baseData.industries) {
        for (const topic of baseData.topics) {
            for (const modifier of baseData.modifiers.adjectives) {
                const name = `${modifier} ${topic} for ${industry}`;
                const slug = makeUnique(name);
                if (!generated.has(slug)) {
                    generated.add(slug);
                    yield {
                        name,
                        slug,
                        category: 'domain-category',
                        subcategory: 'industry-topic',
                        description: `${name} solution`,
                        usageCount: Math.floor(Math.random() * 2000)
                    };
                    count++;
                    if (count >= targetCount) return;
                }
            }
        }
    }

    // 4. Action-based tags (~800)
    log.info('Generating action-based tags...');
    for (const action of baseData.actions) {
        for (const lang of baseData.technologies.languages) {
            for (const framework of baseData.technologies.frameworks) {
                const name = `${action} ${lang} ${framework}`;
                const slug = makeUnique(name);
                if (!generated.has(slug)) {
                    generated.add(slug);
                    yield {
                        name,
                        slug,
                        category: 'intent-objectives',
                        subcategory: 'action',
                        description: `${name} project`,
                        usageCount: Math.floor(Math.random() * 1500)
                    };
                    count++;
                    if (count >= targetCount) return;
                }
            }
        }
    }

    // 5. Comprehensive solution tags (~5,120)
    log.info('Generating comprehensive solution tags...');
    for (const prefix of baseData.modifiers.prefixes) {
        for (const topic of baseData.topics) {
            for (const industry of baseData.industries) {
                for (const lang of baseData.technologies.languages) {
                    const name = `${prefix} ${topic} ${lang} for ${industry}`;
                    const slug = makeUnique(name);
                    if (!generated.has(slug)) {
                        generated.add(slug);
                        yield {
                            name,
                            slug,
                            category: 'domain-category',
                            subcategory: 'solution',
                            description: `${name} - comprehensive offering`,
                            usageCount: Math.floor(Math.random() * 500)
                        };
                        count++;
                        if (count >= targetCount) return;
                    }
                }
            }
        }
    }

    // 6. Fill remaining with numbered variations
    log.info('Generating remaining tags...');
    const templates = [
        (i) => `Tag-${i}`,
        (i) => `Resource-${i}`,
        (i) => `Component-${i}`,
        (i) => `Service-${i}`,
        (i) => `Feature-${i}`
    ];

    let templateIndex = 0;
    while (count < targetCount) {
        const template = templates[templateIndex % templates.length];
        const name = template(count);
        const slug = makeUnique(name);
        if (!generated.has(slug)) {
            generated.add(slug);
            yield {
                name,
                slug,
                category: 'status-meta',
                subcategory: 'identifier',
                description: `Generated tag ${count}`,
                usageCount: Math.floor(Math.random() * 100)
            };
            count++;
        }
        templateIndex++;
    }
}

async function seedDatabase() {
    try {
        // Connect to MongoDB
        log.info(`Connecting to MongoDB: ${MONGODB_URI.replace(/\/\/.*@/, '//***@')}`);
        await mongoose.connect(MONGODB_URI);
        log.info('Connected to MongoDB successfully');

        // Clear existing data
        log.info('Clearing existing tags and categories...');
        await Tag.deleteMany({});
        await Category.deleteMany({});
        log.info('Cleared existing data');

        // Create categories
        const categories = [
            {
                name: 'Geography & Timing',
                slug: 'geography-timing',
                description: 'Location, venue, timeframe, schedule, timezone, and seasonal tags',
                subcategories: ['location', 'venue', 'timeframe', 'schedule', 'timezone', 'season']
            },
            {
                name: 'People & Roles',
                slug: 'people-roles',
                description: 'Target audience, stakeholders, team, expertise, profession, and language tags',
                subcategories: ['audience', 'stakeholder', 'team', 'expertise', 'profession', 'language']
            },
            {
                name: 'Skills & Tools',
                slug: 'skills-tools',
                description: 'Technical skills, software, hardware, methodology, platform, and certifications',
                subcategories: ['tech-stack', 'programming-language', 'framework', 'database', 'cloud-platform', 'tool']
            },
            {
                name: 'Domain & Category',
                slug: 'domain-category',
                description: 'Industry, topic, product, service, business model, and market scope',
                subcategories: ['industry', 'topic', 'industry-topic', 'solution', 'product', 'service']
            },
            {
                name: 'Content & Format',
                slug: 'content-format',
                description: 'Content type, file format, localization, style, length, and accessibility',
                subcategories: ['media-type', 'file-format', 'localization', 'style', 'length', 'accessibility']
            },
            {
                name: 'Intent & Objectives',
                slug: 'intent-objectives',
                description: 'Intent, budget, payment terms, timeline, dependencies, and resources',
                subcategories: ['action', 'budget', 'payment', 'timeline', 'dependencies', 'resources']
            },
            {
                name: 'Constraints & Compliance',
                slug: 'constraints-compliance',
                description: 'Regulatory, security, delivery mode, risk level, and ethics',
                subcategories: ['regulatory', 'security', 'delivery', 'risk', 'ethics']
            },
            {
                name: 'Status & Meta',
                slug: 'status-meta',
                description: 'Status, visibility, version, review, and performance metrics',
                subcategories: ['status', 'visibility', 'version', 'review', 'metrics', 'identifier']
            }
        ];

        await Category.insertMany(categories);
        log.info(`Created ${categories.length} categories`);

        // Generate and insert tags in batches
        log.info(`Starting to generate ${TARGET_COUNT.toLocaleString()} tags...`);
        const startTime = Date.now();

        let batch = [];
        let totalInserted = 0;
        let batchNumber = 0;

        for (const tag of generateTags(TARGET_COUNT)) {
            batch.push(tag);

            if (batch.length >= BATCH_SIZE) {
                try {
                    await Tag.insertMany(batch, { ordered: false });
                    totalInserted += batch.length;
                    batchNumber++;

                    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
                    const rate = (totalInserted / elapsed).toFixed(0);
                    const progress = ((totalInserted / TARGET_COUNT) * 100).toFixed(2);

                    log.info(`Batch ${batchNumber}: Inserted ${totalInserted.toLocaleString()}/${TARGET_COUNT.toLocaleString()} tags (${progress}%) - ${rate} tags/sec`);

                    batch = [];
                } catch (error) {
                    log.error(`Error inserting batch ${batchNumber}:`, error.message);
                    batch = [];
                }
            }
        }

        // Insert remaining tags
        if (batch.length > 0) {
            await Tag.insertMany(batch, { ordered: false });
            totalInserted += batch.length;
            log.info(`Final batch: Inserted ${totalInserted.toLocaleString()} tags`);
        }

        const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
        const avgRate = (totalInserted / totalTime).toFixed(0);

        log.info(`✅ Successfully seeded database in ${totalTime}s`);
        log.info(`📊 Total tags: ${totalInserted.toLocaleString()}`);
        log.info(`⚡ Average rate: ${avgRate} tags/second`);

        // Log statistics
        const stats = await Tag.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        log.info('Tag distribution by category:');
        stats.forEach(stat => {
            log.info(`  ${stat._id}: ${stat.count.toLocaleString()} tags`);
        });

        // Estimate storage usage
        const dbStats = await mongoose.connection.db.stats();
        const storageMB = (dbStats.dataSize / (1024 * 1024)).toFixed(2);
        log.info(`💾 Estimated storage used: ${storageMB} MB`);
        log.info(`📦 Free tier remaining: ~${(512 - storageMB).toFixed(2)} MB`);

        await mongoose.connection.close();
        log.info('Database connection closed');
        process.exit(0);
    } catch (error) {
        log.error('Seeding failed:', error);
        process.exit(1);
    }
}

// Run seeding
seedDatabase();
