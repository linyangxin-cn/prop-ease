import { DoucementInfo } from "./request/types";

// Classification ontology structure as provided
export const CLASSIFICATION_ONTOLOGY: Record<string, Record<string, string>> = {
  "Legal Documents": {
    "Title Deed": "Proof of ownership of the property",
    "Land Registry Extracts": "Information on property boundaries and ownership",
    "Zoning Certificates": "Confirming the permitted use of the property",
    "Easements and Servitudes": "Details of any rights granted to or over the property",
    "Building Permits": "Approvals for construction or renovation",
    "Environmental Permits": "Approval for activities that may impact the environment",
    "Lease Agreements": "Current tenant contracts, including rental conditions, termination clauses, and renewal options",
    "Service Contracts": "Agreements with service providers (cleaning, security, landscaping, etc.)",
    "Notarial Deeds": "Relevant historical deeds associated with the property"
  },
  "Compliance and Certification": {
    "EPC (Energy Performance Certificate)": "A rating of the building's energy efficiency",
    "EPB (Energy Performance of Buildings)": "Compliance documentation for energy regulations",
    "Asbestos Report": "Mandatory documentation assessing the presence of asbestos",
    "Environmental Assessment": "Reports on soil, water, or other environmental risks",
    "Fire Safety Certificates": "Compliance documentation with fire regulations",
    "Lift Inspection Reports": "Maintenance and safety inspection reports for elevators",
    "Boiler Inspection Reports": "Compliance with heating installation requirements",
    "Electrical Inspection Reports": "Certification for electrical safety and compliance",
    "Water Quality Certification": "If applicable, particularly for drinking water or pools",
    "Accessibility Compliance Report": "Ensuring adherence to laws for disabled access"
  },
  "Technical and Maintenance Documents": {
    "Building Plans": "Architectural drawings, blueprints, or CAD files",
    "Technical Installations Documentation": "HVAC, plumbing, electrical systems, etc.",
    "Building Condition Reports": "Structural integrity and maintenance evaluations",
    "Maintenance Logs": "Historical records of maintenance activities",
    "Warranty Documents": "For equipment and structural elements still under warranty",
    "Operating Manuals": "Instructions for technical installations"
  },
  "Financial Documents": {
    "Rent Roll": "Detailed list of current tenants, rents, and payment statuses",
    "Operating Expenses Overview": "Breakdown of property expenses (utilities, maintenance, insurance, etc.)",
    "Tax Records": "Property taxes, VAT, and any related tax documentation",
    "Utility Bills": "Historical data on electricity, water, and gas consumption and costs",
    "Insurance Policies": "Coverage details for property and liability insurance",
    "Service Charges": "Breakdown of costs allocated to tenants and owners",
    "Loan Agreements": "If applicable, mortgages or other financial liabilities tied to the property"
  },
  "Transactional Documents": {
    "Previous Sales Contracts": "Records of prior ownership changes",
    "Valuation Reports": "Independent appraisals of the property value",
    "Brokerage Agreements": "If a broker was involved in the sale or lease process",
    "Due Diligence Reports": "Summaries from previous due diligence processes"
  },
  "Tenant-Specific Documents": {
    "Tenant Contact Information": "For all tenants currently occupying the property",
    "Tenant Fit-Out Agreements": "Any agreements allowing tenants to modify spaces",
    "Deposit Details": "Security deposits and related terms",
    "Tenant Complaints and Resolutions": "Records of issues raised and addressed"
  },
  "Operational and Risk Management": {
    "Disaster Recovery Plans": "Procedures for emergencies affecting the property",
    "Security Protocols": "Details on building access, surveillance, and other security measures",
    "Risk Assessments": "Evaluations of potential property-related risks"
  },
  "Miscellaneous": {
    "Historical Records": "Documents of historical significance or relevance to the property",
    "Neighborhood Information": "Reports or insights about the surrounding area and its impact on the property",
    "Marketing Materials": "Brochures, photos, or videos used for property promotion"
  },
  "Region-Specific Requirements (Belgium/EU)": {
    "Asbest-Attest": "Mandatory in Flanders as of Nov 2022 for properties built before 2001",
    "Soil Certificates (Bodemattest)": "Required for land transactions in Flanders and Brussels",
    "Urban Planning Information (Stedenbouwkundige Informatie)": "Specific to Belgian regions",
    "Sanitary Installations Certification": "Water drainage or septic system compliance"
  },
  "Optional (but Beneficial)": {
    "Sustainability Certifications": "BREEAM, LEED, or other green building certifications",
    "Future Development Plans": "Documentation of potential expansions or modifications",
    "Community Agreements": "Any agreements with local authorities or neighborhood organizations"
  }
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
  Object.entries(CLASSIFICATION_ONTOLOGY).forEach(([category, subcategories]) => {
    const subcategoryNodes: TreeNode[] = Object.keys(subcategories).map(subcategory => ({
      title: subcategory,
      key: `subcategory-${category}-${subcategory}`,
      children: [],
      isLeaf: false,
    }));

    categoryMap[category] = {
      title: category,
      key: `category-${category}`,
      children: subcategoryNodes,
    };
  });

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
    if (!doc.classification_label) {
      // If no classification, add to Miscellaneous
      categoryMap["Miscellaneous"].children?.push({
        title: doc.original_filename,
        key: doc.id,
        isLeaf: true,
      });

      // Increment count for Miscellaneous
      categoryCounts["Miscellaneous"] = (categoryCounts["Miscellaneous"] || 0) + 1;
      return;
    }

    // Parse the classification label (format: "Category/Subcategory")
    const parts = doc.classification_label.split("/");
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
        child => child.key === subcategoryKey
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
        title: doc.original_filename,
        key: doc.id,
        isLeaf: true,
      });
    } else {
      // If no subcategory, add directly to the category
      categoryMap[category].children?.push({
        title: doc.original_filename,
        key: doc.id,
        isLeaf: true,
      });
    }

    // Increment counts
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;

    // Only increment subcategory count if there is a subcategory
    if (subcategory) {
      const subcategoryKey = `subcategory-${category}-${subcategory}`;
      subcategoryCounts[subcategoryKey] = (subcategoryCounts[subcategoryKey] || 0) + 1;
    }
  });

  // Update titles to include document counts
  Object.entries(categoryMap).forEach(([category, node]) => {
    if (categoryCounts[category]) {
      node.title = `${category} (${categoryCounts[category]})`;
      // Add a className for styling
      (node as any).className = 'category-with-documents';
    }

    node.children?.forEach(subcategoryNode => {
      if (subcategoryCounts[subcategoryNode.key as string]) {
        subcategoryNode.title = `${subcategoryNode.title} (${subcategoryCounts[subcategoryNode.key as string]})`;
        // Add a className for styling
        (subcategoryNode as any).className = 'subcategory-with-documents';
      }
    });
  });

  // Convert the map to an array and sort alphabetically
  return Object.values(categoryMap).sort((a, b) => {
    // Put Miscellaneous at the end
    if (a.key === 'category-Miscellaneous') return 1;
    if (b.key === 'category-Miscellaneous') return -1;
    return a.title.localeCompare(b.title);
  });
};
