import { DoucementInfo } from "./request/types";

// Classification ontology structure hardcoded to match backend config.py
export const CLASSIFICATION_ONTOLOGY: Record<string, Record<string, string>> = {
  "Legal Controls & Certifications": {
    "Energy Performance Certificate":
      "A Mandatory document in Belgium that evaluates and rates the energy efficiency of a building, typically, on a scale score, required for construction, sale, or rental transactions",
    "Boiler Inspection Reports":
      "Documents pertaining to the inspection, maintenance, and safety checks of boilers and associated heating systems within a real estate asset. This includes inspection reports, maintenance logs, safety compliance certificates, and any documentation related to the performance and condition of boilers and hot water systems",
    "Electrical Inspection Reports":
      "Documents pertaining to the inspection, testing, and certification of electrical systems within a real estate asset. This includes inspection reports, safety compliance certificates, maintenance logs, and any documentation verifying the safe operation and adherence to safety standards and regulations of electrical systems. Excludes electrical plans and design documents, which are categorized separately",
    "Fire Safety Reports":
      "Documents related to the inspection, testing, and certification of fire safety equipment and systems within a real estate asset. This includes inspection reports, maintenance logs, safety compliance certificates, and any documentation verifying the proper working condition and adherence to safety standards of fire equipment. The inspection is crucial for ensuring the effectiveness, maintenance validity, and safety compliance of all fire safety measures",
    "Lift Inspection Reports":
      "Documents verifying that a lift or elevator complies with safety standards and regulations, ensuring the safe operation and maintenance of lifts in buildings. This includes inspection reports, maintenance logs, safety compliance certificates, and any documentation related to the evaluation and certification of lift safety",
    "Environmental Assessment":
      "Documents related to the evaluation and compliance of environmental factors such as soil, water, air quality, and other ecological components. This includes inspection reports, compliance certificates, environmental impact assessments, and any documentation verifying adherence to environmental regulations and standards",
    "Asbestos Reports":
      "Documents verifying the presence or absence of asbestos in a building, including asbestos attestations, inspection reports, and related certification. These reports are mandatory in Flanders for both housing and workplaces, and in Wallonia for workplaces only. They are essential before renovation or demolition activities to ensure safety and compliance with health regulations. This category also includes all supplementary documents related to the asbestos certification process",
    WELL: "a performance-based system for measuring, certifying, and monitoring features of the built environment that impact human health and well-being. It focuses on aspects such as air, water, nourishment, light, fitness, comfort, and mind, aiming to enhance the health and wellness of building occupants.",
    LEED: "a globally recognized green building certification system developed by the U.S. Green Building Council. It provides a framework for healthy, highly efficient, and cost-saving green buildings, rating them across various categories including energy use, water efficiency, CO2 emissions reduction, and indoor.",
    BREEAM:
      "a widely used international sustainability assessment method for master planning projects, infrastructure, and buildings. It evaluates and rates the environmental, social, and economic sustainability performance of a development, providing a certification recognized globally.",
  },
};

// Interface for tree data structure used by Ant Design's DirectoryTree
export interface TreeNode {
  title: string;
  key: string;
  isLeaf?: boolean;
  children?: TreeNode[];
}

/**
 * Extract date from new_file_name for sorting purposes
 * @param fileName The new_file_name in format YYYY_MM_DD_Title
 * @returns Date object or null if parsing fails
 */
const extractDateFromFileName = (fileName: string): Date | null => {
  if (!fileName) return null;

  // Extract date pattern YYYY_MM_DD from the beginning of the filename
  const dateMatch = fileName.match(/^(\d{4})_(\d{2})_(\d{2})/);
  if (dateMatch) {
    const [, year, month, day] = dateMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    // Validate the date is reasonable
    if (date.getFullYear() >= 1900 && date.getFullYear() <= 2100) {
      return date;
    }
  }
  return null;
};

/**
 * Sort documents by report date extracted from new_file_name
 * @param documents Array of documents to sort
 * @returns Sorted array of documents (newest first)
 */
const sortDocumentsByReportDate = (documents: DoucementInfo[]): DoucementInfo[] => {
  return [...documents].sort((a, b) => {
    const dateA = extractDateFromFileName(a.new_file_name || '');
    const dateB = extractDateFromFileName(b.new_file_name || '');

    // If both have dates, sort by date (newest first)
    if (dateA && dateB) {
      return dateB.getTime() - dateA.getTime();
    }

    // If only one has a date, prioritize the one with date
    if (dateA && !dateB) return -1;
    if (!dateA && dateB) return 1;

    // If neither has a date, sort alphabetically by filename
    const nameA = a.new_file_name || a.original_filename || '';
    const nameB = b.new_file_name || b.original_filename || '';
    return nameA.localeCompare(nameB);
  });
};

/**
 * Organizes documents into a tree structure based on their classification labels
 * @param documents List of documents from the API
 * @param categoriesOrder Optional array of categories from /categories endpoint to preserve order
 * @returns Tree structure for DirectoryTree component
 */
export const organizeDocumentsByClassification = (
  documents: DoucementInfo[] = [],
  categoriesOrder?: string[]
): TreeNode[] => {
  // Sort documents by report date first
  const sortedDocuments = sortDocumentsByReportDate(documents);

  // Create a map to store categories and their subcategories
  const categoryMap: Record<string, TreeNode> = {};

  // Track the order of categories and subcategories
  const categoryOrderMap: Record<string, number> = {};
  const subcategoryOrderMap: Record<string, number> = {};

  // If categoriesOrder is provided, use it to build the structure and track order
  if (categoriesOrder && categoriesOrder.length > 0) {
    categoriesOrder.forEach((fullPath, index) => {
      const parts = fullPath.split("/");
      const category = parts[0];
      const subcategory = parts.length > 1 ? parts[1] : null;

      // Track category order
      if (categoryOrderMap[category] === undefined) {
        categoryOrderMap[category] = index;
      }

      // Initialize category if it doesn't exist
      if (!categoryMap[category]) {
        categoryMap[category] = {
          title: category,
          key: `category-${category}`,
          children: [],
        };
      }

      // Add subcategory if it exists
      if (subcategory) {
        const subcategoryKey = `subcategory-${category}-${subcategory}`;

        // Track subcategory order
        subcategoryOrderMap[subcategoryKey] = index;

        // Check if subcategory already exists
        const existingSubcategory = categoryMap[category].children?.find(
          (child) => child.key === subcategoryKey
        );

        if (!existingSubcategory) {
          categoryMap[category].children?.push({
            title: subcategory,
            key: subcategoryKey,
            children: [],
            isLeaf: false,
          });
        }
      }
    });
  } else {
    // Fallback to hardcoded ontology if no categories provided
    Object.entries(CLASSIFICATION_ONTOLOGY).forEach(
      ([category, subcategories]) => {
        const subcategoryNodes: TreeNode[] = Object.keys(subcategories).map(
          (subcategory) => ({
            title: subcategory,
            key: `subcategory-${category}-${subcategory}`,
            children: [],
            isLeaf: false,
          })
        );

        categoryMap[category] = {
          title: category,
          key: `category-${category}`,
          children: subcategoryNodes,
        };
      }
    );
  }

  // Track document counts for categories and subcategories
  const categoryCounts: Record<string, number> = {};
  const subcategoryCounts: Record<string, number> = {};

  // Process each document (now sorted by report date)
  sortedDocuments.forEach((doc) => {
    // Use user_label if available, otherwise fall back to classification_label
    const finalLabel = doc.user_label || doc.classification_label;

    // Skip documents without classification (don't show unclassified documents)
    if (!finalLabel) {
      return;
    }

    // Parse the classification label (format: "Category/Subcategory")
    const parts = finalLabel.split("/");
    const category = parts[0];
    // If category and subcategory are the same, treat as no subcategory
    const subcategory = parts.length > 1 && parts[1] !== parts[0] ? parts[1] : null;

    // If category doesn't exist in our map, create it (shouldn't happen with predefined ontology)
    if (!categoryMap[category]) {
      categoryMap[category] = {
        title: category,
        key: `category-${category}`,
        children: [],
      };
    }

    if (subcategory) {
      // Find the subcategory node
      const subcategoryKey = `subcategory-${category}-${subcategory}`;
      let subcategoryNode = categoryMap[category].children?.find(
        (child) => child.key === subcategoryKey
      );

      // If subcategory doesn't exist, create it
      if (!subcategoryNode) {
        subcategoryNode = {
          title: subcategory,
          key: subcategoryKey,
          children: [],
          isLeaf: false,
        };
        categoryMap[category].children?.push(subcategoryNode);
      }

      // Add document to the subcategory
      subcategoryNode.children?.push({
        title: doc.new_file_name || doc.original_filename,
        key: doc.id,
        isLeaf: true,
      });
    } else {
      // If no subcategory, add directly to the category
      categoryMap[category].children?.push({
        title: doc.new_file_name || doc.original_filename,
        key: doc.id,
        isLeaf: true,
      });
    }

    // Increment counts
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;

    // Only increment subcategory count if there is a subcategory
    if (subcategory) {
      const subcategoryKey = `subcategory-${category}-${subcategory}`;
      subcategoryCounts[subcategoryKey] =
        (subcategoryCounts[subcategoryKey] || 0) + 1;
    }
  });

  // Update titles to include document counts and filter out empty categories
  const categoriesWithDocuments = Object.entries(categoryMap)
    .filter(([category]) => categoryCounts[category] > 0)
    .map(([category, node]) => {
      // Update category title with count
      node.title = `${category} (${categoryCounts[category]})`;
      // Add a className for styling
      (node as any).className = "category-with-documents";

      // Filter subcategories to only include those with documents and update their titles
      if (node.children) {
        node.children = node.children
          .filter((childNode) => {
            // Keep leaf nodes (documents) always
            if (childNode.isLeaf) {
              return true;
            }
            // For subcategory nodes, only keep if they have documents
            return subcategoryCounts[childNode.key as string] > 0;
          })
          .map((childNode) => {
            // Only update title for subcategory nodes (not leaf document nodes)
            if (!childNode.isLeaf) {
              childNode.title = `${childNode.title} (${
                subcategoryCounts[childNode.key as string]
              })`;
              // Add a className for styling
              (childNode as any).className = "subcategory-with-documents";
            }
            return childNode;
          })
          .sort((a, b) => {
            // Documents (leaf nodes) should come after subcategories
            if (a.isLeaf && !b.isLeaf) return 1;
            if (!a.isLeaf && b.isLeaf) return -1;

            // Both are subcategories - use order from endpoint
            if (!a.isLeaf && !b.isLeaf) {
              const orderA = subcategoryOrderMap[a.key as string];
              const orderB = subcategoryOrderMap[b.key as string];

              if (orderA !== undefined && orderB !== undefined) {
                return orderA - orderB;
              }
            }

            // Fallback to alphabetical sorting
            return (a.title as string).localeCompare(b.title as string);
          });
      }

      return node;
    });

  // Sort categories by their order from the endpoint
  return categoriesWithDocuments.sort((a, b) => {
    // Extract category name from title (remove count)
    const categoryA = a.title.split(' (')[0];
    const categoryB = b.title.split(' (')[0];

    // Use the order from categoryOrderMap if available
    const orderA = categoryOrderMap[categoryA];
    const orderB = categoryOrderMap[categoryB];

    if (orderA !== undefined && orderB !== undefined) {
      return orderA - orderB;
    }

    // Fallback to alphabetical sorting
    return a.title.localeCompare(b.title);
  });
};
