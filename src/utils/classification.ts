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
 * Organizes documents into a tree structure based on their classification labels
 * @param documents List of documents from the API
 * @returns Tree structure for DirectoryTree component
 */
export const organizeDocumentsByClassification = (
  documents: DoucementInfo[] = []
): TreeNode[] => {
  // Create a map to store categories and their subcategories
  const categoryMap: Record<string, TreeNode> = {};

  // First, create all categories and subcategories from the ontology
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

  // Add a Miscellaneous category for unclassified documents
  if (!categoryMap["Miscellaneous"]) {
    categoryMap["Miscellaneous"] = {
      title: "Miscellaneous",
      key: "category-Miscellaneous",
      children: [],
    };
  }

  // Track document counts for categories and subcategories
  const categoryCounts: Record<string, number> = {};
  const subcategoryCounts: Record<string, number> = {};

  // Process each document
  documents.forEach((doc) => {
    // Use user_label if available, otherwise fall back to classification_label
    const finalLabel = doc.user_label || doc.classification_label;

    if (!finalLabel) {
      // If no classification, add to Miscellaneous
      categoryMap["Miscellaneous"].children?.push({
        title: doc.new_file_name || doc.original_filename,
        key: doc.id,
        isLeaf: true,
      });

      // Increment count for Miscellaneous
      categoryCounts["Miscellaneous"] =
        (categoryCounts["Miscellaneous"] || 0) + 1;
      return;
    }

    // Parse the classification label (format: "Category/Subcategory")
    const parts = finalLabel.split("/");
    const category = parts[0];
    const subcategory = parts.length > 1 ? parts[1] : null;

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

  // Update titles to include document counts
  Object.entries(categoryMap).forEach(([category, node]) => {
    if (categoryCounts[category]) {
      node.title = `${category} (${categoryCounts[category]})`;
      // Add a className for styling
      (node as any).className = "category-with-documents";
    }

    node.children?.forEach((subcategoryNode) => {
      if (subcategoryCounts[subcategoryNode.key as string]) {
        subcategoryNode.title = `${subcategoryNode.title} (${
          subcategoryCounts[subcategoryNode.key as string]
        })`;
        // Add a className for styling
        (subcategoryNode as any).className = "subcategory-with-documents";
      }
    });
  });

  // Convert the map to an array and sort alphabetically
  return Object.values(categoryMap).sort((a, b) => {
    // Put Miscellaneous at the end
    if (a.key === "category-Miscellaneous") return 1;
    if (b.key === "category-Miscellaneous") return -1;
    return a.title.localeCompare(b.title);
  });
};
