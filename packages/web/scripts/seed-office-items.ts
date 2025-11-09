/**
 * Seed Office Items Script
 *
 * This script populates the database with a comprehensive catalog of office items.
 * Items are organized by category with realistic details and pricing.
 *
 * Usage:
 *   pnpm tsx apps/web/scripts/seed-office-items.ts
 *
 * Environment Variables Required:
 *   MONGODB_URI - MongoDB connection string
 */

/* eslint-disable no-console */

import mongoose from 'mongoose';

// MongoDB connection URI from environment
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URI_TEST;

// Office item categories (for reference)
const _categories = [
  'Office Supplies',
  'Electronics',
  'Furniture',
  'Paper Products',
  'Writing Instruments',
  'Filing & Storage',
  'Technology Accessories',
  'Breakroom Supplies',
  'Cleaning Supplies',
  'Safety Equipment',
];

// Office items data structure
const officeItems = [
  // Office Supplies (30 items)
  {
    name: 'Stapler Standard',
    category: 'Office Supplies',
    price: 12.99,
    description: 'Standard desktop stapler with 20-sheet capacity',
  },
  {
    name: 'Stapler Heavy Duty',
    category: 'Office Supplies',
    price: 24.99,
    description: 'Heavy-duty stapler for up to 100 sheets',
  },
  {
    name: 'Staple Remover',
    category: 'Office Supplies',
    price: 3.49,
    description: 'Metal staple remover tool',
  },
  {
    name: 'Tape Dispenser Desktop',
    category: 'Office Supplies',
    price: 8.99,
    description: 'Weighted desktop tape dispenser',
  },
  {
    name: 'Scotch Tape Roll',
    category: 'Office Supplies',
    price: 2.99,
    description: 'Clear adhesive tape, 3/4 inch x 1000 inches',
  },
  {
    name: 'Paper Clips Box',
    category: 'Office Supplies',
    price: 4.99,
    description: 'Box of 100 standard paper clips',
  },
  {
    name: 'Binder Clips Assorted',
    category: 'Office Supplies',
    price: 6.99,
    description: 'Assorted sizes binder clips, 30 pack',
  },
  {
    name: 'Push Pins Clear',
    category: 'Office Supplies',
    price: 3.99,
    description: 'Clear plastic push pins, 100 count',
  },
  {
    name: 'Thumbtacks Brass',
    category: 'Office Supplies',
    price: 4.49,
    description: 'Brass thumbtacks, 100 count',
  },
  {
    name: 'Rubber Bands Box',
    category: 'Office Supplies',
    price: 5.49,
    description: 'Assorted rubber bands, 1/4 lb box',
  },
  {
    name: 'Scissors Standard',
    category: 'Office Supplies',
    price: 7.99,
    description: '8-inch stainless steel scissors',
  },
  {
    name: 'Scissors Heavy Duty',
    category: 'Office Supplies',
    price: 14.99,
    description: 'Industrial strength scissors',
  },
  {
    name: 'Letter Opener Metal',
    category: 'Office Supplies',
    price: 6.49,
    description: 'Stainless steel letter opener',
  },
  {
    name: 'Hole Punch 2-Hole',
    category: 'Office Supplies',
    price: 9.99,
    description: 'Two-hole paper punch, 20-sheet capacity',
  },
  {
    name: 'Hole Punch 3-Hole',
    category: 'Office Supplies',
    price: 15.99,
    description: 'Three-hole paper punch, adjustable',
  },
  {
    name: 'Correction Tape',
    category: 'Office Supplies',
    price: 4.99,
    description: 'White correction tape dispenser',
  },
  {
    name: 'Correction Fluid',
    category: 'Office Supplies',
    price: 3.49,
    description: 'Quick-dry white correction fluid',
  },
  {
    name: 'Glue Stick Large',
    category: 'Office Supplies',
    price: 2.99,
    description: 'Non-toxic glue stick, 0.74 oz',
  },
  {
    name: 'Glue Bottle White',
    category: 'Office Supplies',
    price: 4.49,
    description: 'White school glue, 4 oz bottle',
  },
  {
    name: 'Super Glue',
    category: 'Office Supplies',
    price: 5.99,
    description: 'Instant adhesive super glue',
  },
  {
    name: 'Calculator Basic',
    category: 'Office Supplies',
    price: 12.99,
    description: '12-digit basic calculator',
  },
  {
    name: 'Calculator Scientific',
    category: 'Office Supplies',
    price: 24.99,
    description: 'Scientific calculator with functions',
  },
  {
    name: 'Ruler 12-inch',
    category: 'Office Supplies',
    price: 2.49,
    description: 'Clear plastic 12-inch ruler',
  },
  {
    name: 'Ruler Metal 18-inch',
    category: 'Office Supplies',
    price: 6.99,
    description: 'Stainless steel 18-inch ruler',
  },
  {
    name: 'Protractor Plastic',
    category: 'Office Supplies',
    price: 1.99,
    description: '6-inch plastic protractor',
  },
  {
    name: 'Compass Drawing',
    category: 'Office Supplies',
    price: 8.99,
    description: 'Precision drawing compass',
  },
  {
    name: 'Eraser White Rubber',
    category: 'Office Supplies',
    price: 1.49,
    description: 'White rubber eraser for pencil marks',
  },
  {
    name: 'Eraser Gum Art',
    category: 'Office Supplies',
    price: 3.99,
    description: 'Kneaded art gum eraser',
  },
  {
    name: 'Pencil Sharpener Electric',
    category: 'Office Supplies',
    price: 19.99,
    description: 'Electric pencil sharpener with auto-stop',
  },
  {
    name: 'Pencil Sharpener Manual',
    category: 'Office Supplies',
    price: 4.99,
    description: 'Metal manual pencil sharpener',
  },

  // Writing Instruments (25 items)
  {
    name: 'Ballpoint Pen Black',
    category: 'Writing Instruments',
    price: 1.99,
    description: 'Black ballpoint pen, medium point',
  },
  {
    name: 'Ballpoint Pen Blue',
    category: 'Writing Instruments',
    price: 1.99,
    description: 'Blue ballpoint pen, medium point',
  },
  {
    name: 'Ballpoint Pen Red',
    category: 'Writing Instruments',
    price: 1.99,
    description: 'Red ballpoint pen, medium point',
  },
  {
    name: 'Gel Pen Set',
    category: 'Writing Instruments',
    price: 12.99,
    description: 'Set of 10 colored gel pens',
  },
  {
    name: 'Fountain Pen Professional',
    category: 'Writing Instruments',
    price: 45.99,
    description: 'Executive fountain pen with ink cartridge',
  },
  {
    name: 'Mechanical Pencil 0.5mm',
    category: 'Writing Instruments',
    price: 6.99,
    description: 'Refillable mechanical pencil, 0.5mm lead',
  },
  {
    name: 'Mechanical Pencil 0.7mm',
    category: 'Writing Instruments',
    price: 6.99,
    description: 'Refillable mechanical pencil, 0.7mm lead',
  },
  {
    name: 'Pencil #2 Box',
    category: 'Writing Instruments',
    price: 8.99,
    description: 'Box of 12 #2 pencils with erasers',
  },
  {
    name: 'Colored Pencils Set',
    category: 'Writing Instruments',
    price: 15.99,
    description: 'Set of 24 colored pencils',
  },
  {
    name: 'Highlighter Yellow',
    category: 'Writing Instruments',
    price: 2.49,
    description: 'Chisel tip yellow highlighter',
  },
  {
    name: 'Highlighter Set Assorted',
    category: 'Writing Instruments',
    price: 9.99,
    description: 'Set of 6 assorted color highlighters',
  },
  {
    name: 'Permanent Marker Black',
    category: 'Writing Instruments',
    price: 2.99,
    description: 'Black permanent marker, fine tip',
  },
  {
    name: 'Permanent Marker Set',
    category: 'Writing Instruments',
    price: 11.99,
    description: 'Set of 12 assorted permanent markers',
  },
  {
    name: 'Dry Erase Marker Black',
    category: 'Writing Instruments',
    price: 3.49,
    description: 'Black dry erase marker, chisel tip',
  },
  {
    name: 'Dry Erase Marker Set',
    category: 'Writing Instruments',
    price: 14.99,
    description: 'Set of 8 dry erase markers with eraser',
  },
  {
    name: 'Whiteboard Eraser',
    category: 'Writing Instruments',
    price: 4.99,
    description: 'Felt whiteboard eraser',
  },
  {
    name: 'Whiteboard Cleaner Spray',
    category: 'Writing Instruments',
    price: 7.99,
    description: 'Whiteboard cleaning solution, 8 oz',
  },
  {
    name: 'Fine Point Pen Black',
    category: 'Writing Instruments',
    price: 2.49,
    description: 'Black fine point pen, 0.5mm',
  },
  {
    name: 'Rollerball Pen Blue',
    category: 'Writing Instruments',
    price: 3.99,
    description: 'Blue rollerball pen, smooth ink flow',
  },
  {
    name: 'Felt Tip Pen Set',
    category: 'Writing Instruments',
    price: 16.99,
    description: 'Set of 20 felt tip pens, assorted colors',
  },
  {
    name: 'Calligraphy Pen Set',
    category: 'Writing Instruments',
    price: 29.99,
    description: 'Professional calligraphy pen set with nibs',
  },
  {
    name: 'Pen Refills Blue',
    category: 'Writing Instruments',
    price: 5.99,
    description: 'Pack of 5 blue pen refills',
  },
  {
    name: 'Pen Refills Black',
    category: 'Writing Instruments',
    price: 5.99,
    description: 'Pack of 5 black pen refills',
  },
  {
    name: 'Lead Refills 0.5mm',
    category: 'Writing Instruments',
    price: 4.49,
    description: 'Mechanical pencil lead refills, 0.5mm HB',
  },
  {
    name: 'Lead Refills 0.7mm',
    category: 'Writing Instruments',
    price: 4.49,
    description: 'Mechanical pencil lead refills, 0.7mm HB',
  },

  // Paper Products (30 items)
  {
    name: 'Copy Paper Ream',
    category: 'Paper Products',
    price: 24.99,
    description: 'White copy paper, 500 sheets, 8.5x11"',
  },
  {
    name: 'Copy Paper Case',
    category: 'Paper Products',
    price: 49.99,
    description: 'Case of 10 reams, 5000 sheets total',
  },
  {
    name: 'Printer Paper Letter',
    category: 'Paper Products',
    price: 22.99,
    description: 'Premium printer paper, 500 sheets',
  },
  {
    name: 'Printer Paper Legal',
    category: 'Paper Products',
    price: 27.99,
    description: 'Legal size printer paper, 500 sheets',
  },
  {
    name: 'Cardstock White',
    category: 'Paper Products',
    price: 18.99,
    description: 'Heavy cardstock, 100 sheets, 8.5x11"',
  },
  {
    name: 'Cardstock Colored',
    category: 'Paper Products',
    price: 21.99,
    description: 'Assorted color cardstock, 100 sheets',
  },
  {
    name: 'Construction Paper',
    category: 'Paper Products',
    price: 12.99,
    description: 'Construction paper, 50 sheets, assorted',
  },
  {
    name: 'Sticky Notes 3x3',
    category: 'Paper Products',
    price: 8.99,
    description: 'Yellow sticky notes, 12 pads, 100 sheets each',
  },
  {
    name: 'Sticky Notes Assorted',
    category: 'Paper Products',
    price: 11.99,
    description: 'Assorted color sticky notes, variety pack',
  },
  {
    name: 'Index Cards 3x5',
    category: 'Paper Products',
    price: 6.99,
    description: 'White ruled index cards, 100 count',
  },
  {
    name: 'Index Cards 4x6',
    category: 'Paper Products',
    price: 8.99,
    description: 'White ruled index cards, 100 count',
  },
  {
    name: 'Index Cards Colored',
    category: 'Paper Products',
    price: 9.99,
    description: 'Assorted color index cards, 3x5, 100 count',
  },
  {
    name: 'Notepad Legal Ruled',
    category: 'Paper Products',
    price: 14.99,
    description: 'Legal ruled notepad, 50 sheets, letter size',
  },
  {
    name: 'Notepad College Ruled',
    category: 'Paper Products',
    price: 12.99,
    description: 'College ruled notepad, 80 sheets',
  },
  {
    name: 'Spiral Notebook Wide',
    category: 'Paper Products',
    price: 4.99,
    description: 'Wide ruled spiral notebook, 100 sheets',
  },
  {
    name: 'Spiral Notebook College',
    category: 'Paper Products',
    price: 5.99,
    description: 'College ruled spiral notebook, 120 sheets',
  },
  {
    name: 'Composition Notebook',
    category: 'Paper Products',
    price: 3.99,
    description: 'Classic composition notebook, 100 sheets',
  },
  {
    name: 'Graph Paper Pad',
    category: 'Paper Products',
    price: 7.99,
    description: 'Graph paper pad, 1/4 inch grid, 50 sheets',
  },
  {
    name: 'Drawing Pad',
    category: 'Paper Products',
    price: 11.99,
    description: 'White drawing paper pad, 50 sheets',
  },
  {
    name: 'Sketch Pad',
    category: 'Paper Products',
    price: 15.99,
    description: 'Premium sketch pad, 100 sheets',
  },
  {
    name: 'Printer Labels Sheet',
    category: 'Paper Products',
    price: 16.99,
    description: 'Adhesive labels for laser/inkjet, 100 sheets',
  },
  {
    name: 'Mailing Labels',
    category: 'Paper Products',
    price: 12.99,
    description: 'Address labels, 1x2.625", 750 labels',
  },
  {
    name: 'File Folder Labels',
    category: 'Paper Products',
    price: 8.99,
    description: 'Adhesive file folder labels, 252 count',
  },
  {
    name: 'Envelopes #10 Box',
    category: 'Paper Products',
    price: 11.99,
    description: 'Business envelopes #10, 500 count',
  },
  {
    name: 'Envelopes 9x12',
    category: 'Paper Products',
    price: 15.99,
    description: 'Catalog envelopes, 9x12", 100 count',
  },
  {
    name: 'Padded Envelopes',
    category: 'Paper Products',
    price: 19.99,
    description: 'Bubble mailers, assorted sizes, 25 pack',
  },
  {
    name: 'Manila Folders Letter',
    category: 'Paper Products',
    price: 14.99,
    description: 'Manila file folders, letter size, 100 count',
  },
  {
    name: 'Manila Folders Legal',
    category: 'Paper Products',
    price: 17.99,
    description: 'Manila file folders, legal size, 100 count',
  },
  {
    name: 'Hanging File Folders',
    category: 'Paper Products',
    price: 22.99,
    description: 'Hanging file folders, letter, 25 count',
  },
  {
    name: 'Paper Shredder Bags',
    category: 'Paper Products',
    price: 13.99,
    description: 'Shredder waste bags, 25 count',
  },

  // Electronics (25 items)
  {
    name: 'Wireless Mouse',
    category: 'Electronics',
    price: 24.99,
    description: 'Ergonomic wireless optical mouse',
  },
  {
    name: 'Wired Mouse',
    category: 'Electronics',
    price: 12.99,
    description: 'USB wired optical mouse',
  },
  {
    name: 'Wireless Keyboard',
    category: 'Electronics',
    price: 45.99,
    description: 'Full-size wireless keyboard',
  },
  {
    name: 'Wired Keyboard',
    category: 'Electronics',
    price: 29.99,
    description: 'USB wired keyboard with numeric pad',
  },
  {
    name: 'Keyboard Mouse Combo',
    category: 'Electronics',
    price: 59.99,
    description: 'Wireless keyboard and mouse combo',
  },
  {
    name: 'Webcam HD',
    category: 'Electronics',
    price: 69.99,
    description: '1080p HD webcam with microphone',
  },
  {
    name: 'Headset USB',
    category: 'Electronics',
    price: 49.99,
    description: 'USB headset with noise cancellation',
  },
  {
    name: 'Speakers Desktop',
    category: 'Electronics',
    price: 34.99,
    description: 'USB powered desktop speakers',
  },
  {
    name: 'Monitor Stand',
    category: 'Electronics',
    price: 39.99,
    description: 'Adjustable monitor riser stand',
  },
  {
    name: 'Laptop Stand',
    category: 'Electronics',
    price: 44.99,
    description: 'Aluminum laptop stand, adjustable height',
  },
  {
    name: 'USB Hub 4-Port',
    category: 'Electronics',
    price: 19.99,
    description: 'USB 3.0 hub with 4 ports',
  },
  {
    name: 'USB Hub 7-Port',
    category: 'Electronics',
    price: 29.99,
    description: 'Powered USB 3.0 hub with 7 ports',
  },
  {
    name: 'USB Cable Type-C',
    category: 'Electronics',
    price: 12.99,
    description: 'USB-C to USB-C cable, 6 feet',
  },
  {
    name: 'USB Cable Micro',
    category: 'Electronics',
    price: 8.99,
    description: 'Micro USB cable, 6 feet',
  },
  {
    name: 'HDMI Cable 6ft',
    category: 'Electronics',
    price: 14.99,
    description: 'HDMI cable 2.0, 6 feet',
  },
  {
    name: 'Power Strip 6-Outlet',
    category: 'Electronics',
    price: 22.99,
    description: 'Surge protector power strip, 6 outlets',
  },
  {
    name: 'Power Strip 12-Outlet',
    category: 'Electronics',
    price: 39.99,
    description: 'Surge protector with 12 outlets, 2 USB',
  },
  {
    name: 'Extension Cord 15ft',
    category: 'Electronics',
    price: 16.99,
    description: 'Heavy duty extension cord, 15 feet',
  },
  {
    name: 'Cable Organizer',
    category: 'Electronics',
    price: 11.99,
    description: 'Cable management clips and ties',
  },
  {
    name: 'Desk Lamp LED',
    category: 'Electronics',
    price: 34.99,
    description: 'Adjustable LED desk lamp with USB port',
  },
  {
    name: 'Task Light Clamp',
    category: 'Electronics',
    price: 27.99,
    description: 'Clip-on task light with adjustable arm',
  },
  {
    name: 'Paper Shredder',
    category: 'Electronics',
    price: 89.99,
    description: 'Cross-cut paper shredder, 12-sheet capacity',
  },
  {
    name: 'Label Maker',
    category: 'Electronics',
    price: 39.99,
    description: 'Electronic label maker with keyboard',
  },
  {
    name: 'Time Clock',
    category: 'Electronics',
    price: 149.99,
    description: 'Electronic time clock for employee tracking',
  },
  {
    name: 'Document Scanner',
    category: 'Electronics',
    price: 199.99,
    description: 'Portable document scanner with OCR',
  },

  // Furniture (20 items)
  {
    name: 'Office Chair Ergonomic',
    category: 'Furniture',
    price: 249.99,
    description: 'Ergonomic office chair with lumbar support',
  },
  {
    name: 'Office Chair Executive',
    category: 'Furniture',
    price: 399.99,
    description: 'Executive leather office chair',
  },
  {
    name: 'Office Chair Guest',
    category: 'Furniture',
    price: 129.99,
    description: 'Stackable guest chair, set of 2',
  },
  {
    name: 'Desk Standard',
    category: 'Furniture',
    price: 299.99,
    description: 'Standard office desk, 60x30 inches',
  },
  {
    name: 'Desk L-Shaped',
    category: 'Furniture',
    price: 449.99,
    description: 'L-shaped corner desk with storage',
  },
  {
    name: 'Desk Standing',
    category: 'Furniture',
    price: 599.99,
    description: 'Electric height-adjustable standing desk',
  },
  {
    name: 'Filing Cabinet 2-Drawer',
    category: 'Furniture',
    price: 189.99,
    description: 'Vertical filing cabinet, 2 drawers',
  },
  {
    name: 'Filing Cabinet 4-Drawer',
    category: 'Furniture',
    price: 299.99,
    description: 'Vertical filing cabinet, 4 drawers',
  },
  {
    name: 'Bookshelf 5-Tier',
    category: 'Furniture',
    price: 149.99,
    description: 'Open bookshelf, 5 shelves',
  },
  {
    name: 'Storage Cabinet',
    category: 'Furniture',
    price: 279.99,
    description: 'Locking storage cabinet with shelves',
  },
  {
    name: 'Conference Table',
    category: 'Furniture',
    price: 799.99,
    description: 'Conference table, seats 8-10 people',
  },
  {
    name: 'Folding Table 6ft',
    category: 'Furniture',
    price: 89.99,
    description: 'Folding utility table, 6 feet',
  },
  {
    name: 'Whiteboard Wall-Mount',
    category: 'Furniture',
    price: 129.99,
    description: 'Magnetic whiteboard, 4x6 feet',
  },
  {
    name: 'Whiteboard Mobile',
    category: 'Furniture',
    price: 199.99,
    description: 'Double-sided mobile whiteboard',
  },
  {
    name: 'Coat Rack Standing',
    category: 'Furniture',
    price: 49.99,
    description: 'Free-standing coat rack with umbrella holder',
  },
  {
    name: 'Bulletin Board Cork',
    category: 'Furniture',
    price: 39.99,
    description: 'Cork bulletin board, 3x4 feet',
  },
  {
    name: 'Magazine Rack',
    category: 'Furniture',
    price: 34.99,
    description: 'Wall-mounted magazine rack',
  },
  {
    name: 'Desk Organizer Tray',
    category: 'Furniture',
    price: 24.99,
    description: 'Multi-compartment desk organizer',
  },
  {
    name: 'Monitor Arm Mount',
    category: 'Furniture',
    price: 79.99,
    description: 'Adjustable monitor arm mount',
  },
  {
    name: 'Footrest Ergonomic',
    category: 'Furniture',
    price: 29.99,
    description: 'Adjustable footrest for desk',
  },

  // Filing & Storage (25 items)
  {
    name: 'File Box Portable',
    category: 'Filing & Storage',
    price: 19.99,
    description: 'Portable plastic file box with handle',
  },
  {
    name: 'Storage Box Letter',
    category: 'Filing & Storage',
    price: 12.99,
    description: 'Corrugated storage box for letter files',
  },
  {
    name: 'Storage Box Legal',
    category: 'Filing & Storage',
    price: 14.99,
    description: 'Corrugated storage box for legal files',
  },
  {
    name: 'Banker Box 12-Pack',
    category: 'Filing & Storage',
    price: 39.99,
    description: "Banker's boxes with lids, 12 pack",
  },
  {
    name: 'File Crate Plastic',
    category: 'Filing & Storage',
    price: 16.99,
    description: 'Stackable plastic file crate',
  },
  {
    name: 'Desktop File Sorter',
    category: 'Filing & Storage',
    price: 22.99,
    description: 'Vertical desktop file sorter, 8 slots',
  },
  {
    name: 'Letter Tray Stackable',
    category: 'Filing & Storage',
    price: 14.99,
    description: 'Stackable letter tray, set of 3',
  },
  {
    name: 'Magazine File Holder',
    category: 'Filing & Storage',
    price: 9.99,
    description: 'Cardboard magazine file holder',
  },
  {
    name: 'Hanging File Frame',
    category: 'Filing & Storage',
    price: 18.99,
    description: 'Adjustable hanging file frame for drawers',
  },
  {
    name: 'File Folder Expanding',
    category: 'Filing & Storage',
    price: 11.99,
    description: 'Expanding file folder, 13 pockets',
  },
  {
    name: 'Accordion File A-Z',
    category: 'Filing & Storage',
    price: 15.99,
    description: 'Alphabetic accordion file organizer',
  },
  {
    name: 'Document Wallet',
    category: 'Filing & Storage',
    price: 8.99,
    description: 'Poly document wallet with snap closure',
  },
  {
    name: 'Binder 1-inch',
    category: 'Filing & Storage',
    price: 6.99,
    description: '3-ring binder, 1-inch capacity',
  },
  {
    name: 'Binder 2-inch',
    category: 'Filing & Storage',
    price: 9.99,
    description: '3-ring binder, 2-inch capacity',
  },
  {
    name: 'Binder 3-inch',
    category: 'Filing & Storage',
    price: 12.99,
    description: '3-ring binder, 3-inch capacity',
  },
  {
    name: 'Sheet Protectors Box',
    category: 'Filing & Storage',
    price: 13.99,
    description: 'Clear sheet protectors, 100 count',
  },
  {
    name: 'Divider Tabs 5-Tab',
    category: 'Filing & Storage',
    price: 4.99,
    description: 'Binder dividers with 5 tabs',
  },
  {
    name: 'Divider Tabs 8-Tab',
    category: 'Filing & Storage',
    price: 6.99,
    description: 'Binder dividers with 8 tabs',
  },
  {
    name: 'Report Cover Clear',
    category: 'Filing & Storage',
    price: 7.99,
    description: 'Clear plastic report covers, 25 pack',
  },
  {
    name: 'Presentation Folder',
    category: 'Filing & Storage',
    price: 19.99,
    description: 'Professional presentation folders, 10 pack',
  },
  {
    name: 'CD/DVD Sleeves',
    category: 'Filing & Storage',
    price: 9.99,
    description: 'Paper CD/DVD sleeves, 100 count',
  },
  {
    name: 'CD Storage Case',
    category: 'Filing & Storage',
    price: 24.99,
    description: 'CD/DVD storage case, holds 128 discs',
  },
  {
    name: 'Archive Storage Box',
    category: 'Filing & Storage',
    price: 29.99,
    description: 'Heavy-duty archive storage box',
  },
  {
    name: 'Rolling Cart Storage',
    category: 'Filing & Storage',
    price: 59.99,
    description: 'Mobile storage cart with drawers',
  },
  {
    name: 'Mesh Desk Organizer',
    category: 'Filing & Storage',
    price: 19.99,
    description: 'Metal mesh desk organizer set',
  },

  // Technology Accessories (15 items)
  {
    name: 'Laptop Sleeve 15-inch',
    category: 'Technology Accessories',
    price: 19.99,
    description: 'Padded laptop sleeve for 15-inch laptops',
  },
  {
    name: 'Laptop Bag Messenger',
    category: 'Technology Accessories',
    price: 49.99,
    description: 'Professional laptop messenger bag',
  },
  {
    name: 'Laptop Backpack',
    category: 'Technology Accessories',
    price: 59.99,
    description: 'Business laptop backpack with USB port',
  },
  {
    name: 'Mouse Pad Standard',
    category: 'Technology Accessories',
    price: 7.99,
    description: 'Standard mouse pad with wrist rest',
  },
  {
    name: 'Mouse Pad Extended',
    category: 'Technology Accessories',
    price: 24.99,
    description: 'Extended desk mouse pad, 31x15 inches',
  },
  {
    name: 'Keyboard Wrist Rest',
    category: 'Technology Accessories',
    price: 16.99,
    description: 'Ergonomic keyboard wrist rest',
  },
  {
    name: 'Screen Protector 15-inch',
    category: 'Technology Accessories',
    price: 29.99,
    description: 'Privacy screen protector for 15-inch monitor',
  },
  {
    name: 'Screen Cleaning Kit',
    category: 'Technology Accessories',
    price: 12.99,
    description: 'Screen cleaning spray and microfiber cloth',
  },
  {
    name: 'Compressed Air Can',
    category: 'Technology Accessories',
    price: 8.99,
    description: 'Compressed air duster for electronics',
  },
  {
    name: 'Ethernet Cable Cat6',
    category: 'Technology Accessories',
    price: 11.99,
    description: 'Cat6 ethernet cable, 10 feet',
  },
  {
    name: 'Adapter USB-C to HDMI',
    category: 'Technology Accessories',
    price: 18.99,
    description: 'USB-C to HDMI adapter',
  },
  {
    name: 'Adapter USB-C to USB',
    category: 'Technology Accessories',
    price: 9.99,
    description: 'USB-C to USB 3.0 adapter',
  },
  {
    name: 'Portable Hard Drive 1TB',
    category: 'Technology Accessories',
    price: 79.99,
    description: 'External portable hard drive, 1TB',
  },
  {
    name: 'Flash Drive 32GB',
    category: 'Technology Accessories',
    price: 14.99,
    description: 'USB 3.0 flash drive, 32GB',
  },
  {
    name: 'Flash Drive 64GB',
    category: 'Technology Accessories',
    price: 19.99,
    description: 'USB 3.0 flash drive, 64GB',
  },

  // Breakroom Supplies (10 items)
  {
    name: 'Coffee Maker 12-Cup',
    category: 'Breakroom Supplies',
    price: 49.99,
    description: 'Programmable coffee maker, 12-cup capacity',
  },
  {
    name: 'Coffee Filters 100-Pack',
    category: 'Breakroom Supplies',
    price: 6.99,
    description: 'Paper coffee filters, 100 count',
  },
  {
    name: 'Disposable Cups 50-Pack',
    category: 'Breakroom Supplies',
    price: 8.99,
    description: 'Paper cups with lids, 16 oz, 50 pack',
  },
  {
    name: 'Paper Plates 100-Pack',
    category: 'Breakroom Supplies',
    price: 7.99,
    description: 'Disposable paper plates, 9 inch, 100 count',
  },
  {
    name: 'Plastic Cutlery Set',
    category: 'Breakroom Supplies',
    price: 9.99,
    description: 'Plastic forks, knives, spoons, 150 pieces',
  },
  {
    name: 'Paper Towels 6-Pack',
    category: 'Breakroom Supplies',
    price: 14.99,
    description: 'Paper towel rolls, 6 pack',
  },
  {
    name: 'Napkins 500-Pack',
    category: 'Breakroom Supplies',
    price: 5.99,
    description: 'Paper napkins, 500 count',
  },
  {
    name: 'Trash Bags 13-Gallon',
    category: 'Breakroom Supplies',
    price: 12.99,
    description: 'Kitchen trash bags, 13 gallon, 50 count',
  },
  {
    name: 'Dish Soap Bottle',
    category: 'Breakroom Supplies',
    price: 4.99,
    description: 'Dish soap, 28 oz bottle',
  },
  {
    name: 'Microwave Oven',
    category: 'Breakroom Supplies',
    price: 89.99,
    description: 'Compact microwave oven, 0.7 cu ft',
  },

  // Cleaning Supplies (10 items)
  {
    name: 'All-Purpose Cleaner',
    category: 'Cleaning Supplies',
    price: 6.99,
    description: 'Multi-surface cleaner spray, 32 oz',
  },
  {
    name: 'Disinfectant Spray',
    category: 'Cleaning Supplies',
    price: 8.99,
    description: 'Disinfectant spray, kills 99.9% germs',
  },
  {
    name: 'Glass Cleaner',
    category: 'Cleaning Supplies',
    price: 5.99,
    description: 'Glass and window cleaner, 32 oz',
  },
  {
    name: 'Disinfectant Wipes',
    category: 'Cleaning Supplies',
    price: 7.99,
    description: 'Disinfecting wipes, 75 count',
  },
  {
    name: 'Microfiber Cloths',
    category: 'Cleaning Supplies',
    price: 11.99,
    description: 'Microfiber cleaning cloths, 12 pack',
  },
  {
    name: 'Dust Mop Kit',
    category: 'Cleaning Supplies',
    price: 24.99,
    description: 'Dust mop with extendable handle',
  },
  {
    name: 'Broom and Dustpan',
    category: 'Cleaning Supplies',
    price: 16.99,
    description: 'Angle broom with dustpan set',
  },
  {
    name: 'Vacuum Cleaner Compact',
    category: 'Cleaning Supplies',
    price: 79.99,
    description: 'Compact upright vacuum cleaner',
  },
  {
    name: 'Hand Sanitizer Pump',
    category: 'Cleaning Supplies',
    price: 9.99,
    description: 'Hand sanitizer pump bottle, 32 oz',
  },
  {
    name: 'Latex Gloves Box',
    category: 'Cleaning Supplies',
    price: 12.99,
    description: 'Disposable latex gloves, 100 count',
  },

  // Safety Equipment (10 items)
  {
    name: 'First Aid Kit',
    category: 'Safety Equipment',
    price: 29.99,
    description: 'Complete first aid kit, 100 pieces',
  },
  {
    name: 'Fire Extinguisher',
    category: 'Safety Equipment',
    price: 49.99,
    description: 'ABC fire extinguisher, 5 lb',
  },
  {
    name: 'Safety Glasses',
    category: 'Safety Equipment',
    price: 8.99,
    description: 'Clear safety glasses with side shields',
  },
  {
    name: 'Face Masks Box',
    category: 'Safety Equipment',
    price: 14.99,
    description: 'Disposable face masks, 50 count',
  },
  {
    name: 'Emergency Exit Sign',
    category: 'Safety Equipment',
    price: 24.99,
    description: 'LED emergency exit sign with battery backup',
  },
  {
    name: 'Caution Wet Floor Sign',
    category: 'Safety Equipment',
    price: 18.99,
    description: 'Yellow caution wet floor sign',
  },
  {
    name: 'Ear Plugs Box',
    category: 'Safety Equipment',
    price: 11.99,
    description: 'Foam ear plugs, 100 pairs',
  },
  {
    name: 'Hard Hat',
    category: 'Safety Equipment',
    price: 19.99,
    description: 'ANSI certified safety hard hat',
  },
  {
    name: 'Safety Vest',
    category: 'Safety Equipment',
    price: 12.99,
    description: 'High visibility safety vest',
  },
  {
    name: 'Flashlight LED',
    category: 'Safety Equipment',
    price: 15.99,
    description: 'Rechargeable LED flashlight',
  },
];

async function seedOfficeItems() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }

    const collection = db.collection('items');

    console.log(`📝 Seeding ${officeItems.length} office items...`);

    let insertedCount = 0;
    let skippedCount = 0;

    for (const item of officeItems) {
      // Check if item already exists (by name and category)
      const existing = await collection.findOne({
        name: item.name,
        category: item.category,
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      // Insert new item
      await collection.insertOne({
        name: item.name,
        category: item.category,
        description: item.description,
        estimatedPrice: item.price,
        unit: 'each',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      insertedCount++;
    }

    console.log(`\n✅ Seed completed successfully!`);
    console.log(`   📊 Inserted: ${insertedCount} items`);
    console.log(`   ⏭️  Skipped: ${skippedCount} items (already exist)`);

    // Show category breakdown
    console.log('\n📊 Items by category:');
    const categoryCounts = officeItems.reduce(
      (acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        console.log(`   - ${category}: ${count} items`);
      });

    // Total count verification
    const totalInDb = await collection.countDocuments({ status: 'active' });
    console.log(`\n📈 Total active items in database: ${totalInDb}`);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run the seed
seedOfficeItems();
