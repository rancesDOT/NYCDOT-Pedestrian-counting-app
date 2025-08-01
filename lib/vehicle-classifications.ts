export interface VehicleSubClass {
  name: string
  description: string
  examples: string[]
}

export interface VehicleClass {
  id: number
  name: string
  description: string
  subClasses: VehicleSubClass[]
  color: string
  bgColor: string
  textColor: string
}

export const vehicleClassifications: VehicleClass[] = [
  {
    id: 1,
    name: "Motorcycles",
    description: "All motorcycles",
    color: "#ef4444",
    bgColor: "bg-red-500",
    textColor: "text-red-600",
    subClasses: [
      {
        name: "Standard Motorcycle",
        description: "Regular motorcycles",
        examples: ["Sport bikes", "Cruisers", "Standard bikes"],
      },
      {
        name: "Scooter",
        description: "Small motorcycles and scooters",
        examples: ["Mopeds", "Scooters", "Small displacement bikes"],
      },
    ],
  },
  {
    id: 2,
    name: "Passenger Cars",
    description: "All passenger vehicles",
    color: "#3b82f6",
    bgColor: "bg-blue-500",
    textColor: "text-blue-600",
    subClasses: [
      {
        name: "Sedan",
        description: "4-door passenger cars",
        examples: ["Compact cars", "Mid-size cars", "Full-size cars"],
      },
      {
        name: "SUV",
        description: "Sport utility vehicles",
        examples: ["Compact SUV", "Mid-size SUV", "Full-size SUV"],
      },
      {
        name: "Pickup Truck",
        description: "Light pickup trucks",
        examples: ["Compact pickup", "Full-size pickup"],
      },
      {
        name: "Van",
        description: "Passenger vans",
        examples: ["Minivan", "Full-size van"],
      },
    ],
  },
  {
    id: 3,
    name: "Four Tire, Single Unit",
    description: "Light trucks and vans",
    color: "#10b981",
    bgColor: "bg-emerald-500",
    textColor: "text-emerald-600",
    subClasses: [
      {
        name: "Light Truck",
        description: "Small commercial trucks",
        examples: ["Delivery trucks", "Service trucks"],
      },
      {
        name: "Large Van",
        description: "Commercial vans",
        examples: ["Cargo van", "Box van"],
      },
    ],
  },
  {
    id: 4,
    name: "Buses",
    description: "All bus types",
    color: "#f59e0b",
    bgColor: "bg-amber-500",
    textColor: "text-amber-600",
    subClasses: [
      {
        name: "School Bus",
        description: "School buses",
        examples: ["Standard school bus", "Small school bus"],
      },
      {
        name: "Transit Bus",
        description: "Public transit buses",
        examples: ["City bus", "Express bus"],
      },
      {
        name: "Coach Bus",
        description: "Long-distance buses",
        examples: ["Tour bus", "Charter bus"],
      },
    ],
  },
  {
    id: 5,
    name: "Two Axle, Six Tire, Single Unit",
    description: "Medium trucks",
    color: "#8b5cf6",
    bgColor: "bg-purple-500",
    textColor: "text-purple-600",
    subClasses: [
      {
        name: "Medium Truck",
        description: "Medium-duty trucks",
        examples: ["Delivery truck", "Utility truck"],
      },
      {
        name: "Large Pickup",
        description: "Heavy-duty pickup trucks",
        examples: ["Dually pickup", "Commercial pickup"],
      },
    ],
  },
  {
    id: 6,
    name: "Three Axle, Single Unit",
    description: "Large single-unit trucks",
    color: "#06b6d4",
    bgColor: "bg-cyan-500",
    textColor: "text-cyan-600",
    subClasses: [
      {
        name: "Large Single Unit",
        description: "Large trucks without trailers",
        examples: ["Garbage truck", "Fire truck", "Large delivery truck"],
      },
    ],
  },
]

export const getVehicleClassById = (id: number): VehicleClass | undefined => {
  return vehicleClassifications.find((vc) => vc.id === id)
}

export const getSubClassByName = (classId: number, subClassName: string): VehicleSubClass | undefined => {
  const vehicleClass = getVehicleClassById(classId)
  return vehicleClass?.subClasses.find((sc) => sc.name === subClassName)
}
