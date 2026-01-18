require('dotenv').config();
const mongoose = require('mongoose');
const Tag = require('../models/Tag');
const Category = require('../models/Category');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tags-api';
const TARGET_COUNT = 10000000; // 10 million tags
const BATCH_SIZE = 5007; // Insert 5007 tags at a time

// Logger
const log = {
  info: (msg, ...args) => console.log(`[INFO]: ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[ERROR]: ${msg}`, ...args)
};

// Base data arrays for tag generation
const baseData = {
  locations: {
    countries: ['USA', 'UK', 'Canada', 'Australia', 'Germany', 'France', 'Japan', 'China', 'India', 'Brazil', 'Mexico', 'Spain', 'Italy', 'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Switzerland', 'Austria', 'Belgium', 'Poland', 'Russia', 'South Korea', 'Singapore', 'Malaysia', 'Thailand', 'Vietnam', 'Indonesia', 'Philippines', 'New Zealand', 'Ireland', 'Portugal', 'Greece', 'Turkey', 'UAE', 'Saudi Arabia', 'Egypt', 'South Africa', 'Nigeria', 'Kenya', 'Argentina', 'Chile', 'Colombia', 'Peru', 'Venezuela', 'Ecuador', 'Uruguay', 'Paraguay', 'Bolivia'],
    cities: ['New York', 'London', 'Paris', 'Tokyo', 'Berlin', 'Sydney', 'Toronto', 'Mumbai', 'Singapore', 'Dubai', 'Los Angeles', 'Chicago', 'San Francisco', 'Seattle', 'Boston', 'Miami', 'Austin', 'Denver', 'Portland', 'Atlanta', 'Dallas', 'Houston', 'Philadelphia', 'Phoenix', 'San Diego', 'Barcelona', 'Madrid', 'Rome', 'Milan', 'Amsterdam', 'Brussels', 'Copenhagen', 'Stockholm', 'Oslo', 'Helsinki', 'Zurich', 'Vienna', 'Prague', 'Budapest', 'Warsaw', 'Moscow', 'Seoul', 'Hong Kong', 'Shanghai', 'Beijing', 'Bangkok', 'Kuala Lumpur', 'Jakarta', 'Manila', 'Melbourne', 'Brisbane', 'Auckland', 'Dublin', 'Lisbon', 'Athens', 'Istanbul', 'Cairo', 'Cape Town', 'Johannesburg', 'Nairobi', 'Buenos Aires', 'Santiago', 'Bogota', 'Lima', 'Mexico City', 'Sao Paulo', 'Rio de Janeiro', 'Caracas', 'Quito', 'Montevideo', 'Asuncion', 'La Paz']
  },

  technologies: {
    languages: ['JavaScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'TypeScript', 'Scala', 'R', 'MATLAB', 'Perl', 'Haskell', 'Lua', 'Dart', 'Elixir', 'Clojure', 'F#', 'Objective-C', 'Shell', 'PowerShell', 'SQL', 'HTML', 'CSS', 'SASS', 'LESS', 'Assembly', 'Fortran', 'COBOL', 'Ada', 'Lisp', 'Prolog', 'Erlang', 'Julia', 'Groovy', 'Solidity'],
    frameworks: ['React', 'Angular', 'Vue.js', 'Next.js', 'Nuxt.js', 'Svelte', 'Node.js', 'Express.js', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Laravel', 'Ruby on Rails', 'ASP.NET', '.NET Core', 'Phoenix', 'Gin', 'Echo', 'Fiber'],
    databases: ['MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle', 'SQL Server', 'MariaDB', 'Cassandra', 'DynamoDB', 'Firebase', 'Supabase', 'CouchDB', 'Neo4j', 'InfluxDB', 'Elasticsearch', 'Solr', 'RethinkDB', 'ArangoDB', 'CockroachDB']
  },

  industries: ['Healthcare', 'Education', 'Finance', 'Technology', 'Retail', 'Manufacturing', 'Construction', 'Real Estate', 'Transportation', 'Logistics', 'Hospitality', 'Tourism', 'Entertainment', 'Media', 'Publishing', 'Advertising', 'Marketing', 'Telecommunications', 'Energy', 'Utilities', 'Agriculture', 'Mining', 'Pharmaceutical', 'Biotechnology', 'Aerospace', 'Automotive', 'Chemical', 'Food & Beverage', 'Fashion', 'Beauty', 'Sports', 'Fitness', 'Gaming', 'E-commerce', 'SaaS', 'Consulting', 'Legal', 'Accounting', 'Insurance', 'Banking'],

  topics: ['Machine Learning', 'Artificial Intelligence', 'Data Science', 'Blockchain', 'Cryptocurrency', 'IoT', 'Cloud Computing', 'Cybersecurity', 'DevOps', 'Mobile Development', 'Web Development', 'Game Development', 'AR/VR', 'Quantum Computing', 'Big Data', 'Analytics', 'Business Intelligence', 'Digital Marketing', 'SEO', 'Content Marketing', 'Social Media', 'Email Marketing', 'Affiliate Marketing', 'Dropshipping', 'Freelancing', 'Remote Work', 'Entrepreneurship', 'Startup', 'Product Management', 'Project Management', 'Agile', 'Scrum', 'Lean', 'Six Sigma', 'User Experience', 'User Interface', 'Design Thinking', 'Branding', 'Photography', 'Videography'],

  modifiers: {
    prefixes: ['Advanced', 'Basic', 'Professional', 'Enterprise', 'Small Business', 'Startup', 'Corporate', 'Personal', 'Commercial', 'Industrial', 'Academic', 'Research', 'Development', 'Production', 'Testing', 'Beta', 'Alpha', 'Stable', 'Legacy', 'Modern', 'Traditional', 'Innovative', 'Creative', 'Technical', 'Strategic', 'Tactical', 'Operational', 'Executive', 'Management', 'Leadership', 'Senior', 'Junior', 'Mid-Level', 'Entry-Level', 'Expert', 'Beginner', 'Intermediate', 'Certified', 'Licensed', 'Premium', 'Standard', 'Pro', 'Ultimate', 'Essential', 'Complete', 'Comprehensive', 'Specialized'],
    suffixes: ['Solution', 'Service', 'Platform', 'Tool', 'Framework', 'System', 'Application', 'Software', 'Hardware', 'Product', 'Package', 'Suite', 'Kit', 'Bundle', 'Module', 'Component', 'Plugin', 'Extension', 'Addon', 'Integration', 'API', 'SDK', 'Library', 'Resource', 'Template', 'Theme', 'Design', 'Pattern', 'Strategy', 'Approach', 'Method', 'Technique', 'Process', 'Workflow', 'Pipeline', 'Infrastructure', 'Architecture', 'Stack', 'Environment', 'Ecosystem'],
    adjectives: ['Fast', 'Secure', 'Scalable', 'Reliable', 'Efficient', 'Powerful', 'Flexible', 'Robust', 'Lightweight', 'High-performance', 'Low-latency', 'Real-time', 'Asynchronous', 'Distributed', 'Centralized', 'Decentralized', 'Open-source', 'Proprietary', 'Cloud-based', 'On-premise', 'Hybrid', 'Mobile-first', 'Responsive', 'Adaptive', 'Progressive', 'Automated', 'Intelligent', 'Smart', 'Simple', 'Complex', 'Minimal', 'Modular', 'Serverless', 'Containerized']
  },

  actions: ['Build', 'Create', 'Design', 'Develop', 'Deploy', 'Maintain', 'Optimize', 'Analyze', 'Monitor', 'Test', 'Debug', 'Refactor', 'Migrate', 'Upgrade', 'Scale', 'Secure', 'Automate', 'Integrate', 'Implement', 'Configure', 'Customize', 'Extend', 'Enhance', 'Improve', 'Fix', 'Troubleshoot', 'Document', 'Train', 'Support', 'Manage']
};

// Generate unique tag combinations
function* generateTags(targetCount) {
  let count = 0;
  const generated = new Set();

  const makeUnique = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  };

  // 1. Location-based tags
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

  // 2. Technology stack combinations
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

  // 3. Industry + topic combinations
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
            description: `${name} - specialized solution`,
            usageCount: Math.floor(Math.random() * 2000)
          };
          count++;
          if (count >= targetCount) return;
        }
      }
    }
  }

  // 4. Action + technology + suffix combinations
  log.info('Generating action-based tags...');
  for (const action of baseData.actions) {
    for (const lang of baseData.technologies.languages) {
      for (const suffix of baseData.modifiers.suffixes) {
        const name = `${action} ${lang} ${suffix}`;
        const slug = makeUnique(name);
        if (!generated.has(slug)) {
          generated.add(slug);
          yield {
            name,
            slug,
            category: 'intent-objectives',
            subcategory: 'action',
            description: `${name} - actionable tag`,
            usageCount: Math.floor(Math.random() * 1500)
          };
          count++;
          if (count >= targetCount) return;
        }
      }
    }
  }

  // 5. Comprehensive solution tags
  log.info('Generating comprehensive solution tags...');
  for (const prefix of baseData.modifiers.prefixes) {
    for (const topic of baseData.topics) {
      for (const suffix of baseData.modifiers.suffixes) {
        for (const industry of baseData.industries) {
          const name = `${prefix} ${topic} ${suffix} for ${industry}`;
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

  // 6. Numbered variations
  log.info('Generating numbered variations...');
  const templates = [
    (i) => `Tag-${i}`,
    (i) => `Item-${i}`,
    (i) => `Resource-${i}`,
    (i) => `Asset-${i}`,
    (i) => `Component-${i}`,
    (i) => `Module-${i}`,
    (i) => `Element-${i}`,
    (i) => `Feature-${i}`,
    (i) => `Service-${i}`,
    (i) => `Product-${i}`
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
    log.info('Clearing existing data...');
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
