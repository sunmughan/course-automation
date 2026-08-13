import { prisma } from "@/lib/db";

export interface CurriculumData {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  status: string;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ModuleData {
  id: string;
  curriculumId: string;
  title: string;
  description: string | null;
  order: number;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

function formatCurriculum(curriculum: {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  status: string;
  settings: string;
  createdAt: Date;
  updatedAt: Date;
}): CurriculumData {
  return {
    id: curriculum.id,
    organizationId: curriculum.organizationId,
    name: curriculum.name,
    description: curriculum.description,
    status: curriculum.status,
    settings: JSON.parse(curriculum.settings),
    createdAt: curriculum.createdAt.toISOString(),
    updatedAt: curriculum.updatedAt.toISOString(),
  };
}

function formatModule(module: {
  id: string;
  curriculumId: string;
  title: string;
  description: string | null;
  order: number;
  settings: string;
  createdAt: Date;
  updatedAt: Date;
}): ModuleData {
  return {
    id: module.id,
    curriculumId: module.curriculumId,
    title: module.title,
    description: module.description,
    order: module.order,
    settings: JSON.parse(module.settings),
    createdAt: module.createdAt.toISOString(),
    updatedAt: module.updatedAt.toISOString(),
  };
}

export async function createCurriculum(data: {
  organizationId: string;
  name: string;
  description?: string;
  status?: string;
  settings?: Record<string, unknown>;
}): Promise<CurriculumData> {
  const curriculum = await prisma.customCurriculum.create({
    data: {
      organizationId: data.organizationId,
      name: data.name,
      description: data.description,
      status: data.status || "draft",
      settings: data.settings !== undefined ? JSON.stringify(data.settings) : "{}",
    },
  });

  return formatCurriculum(curriculum);
}

export async function getCurriculum(
  curriculumId: string
): Promise<CurriculumData | null> {
  const curriculum = await prisma.customCurriculum.findUnique({
    where: { id: curriculumId },
  });

  return curriculum ? formatCurriculum(curriculum) : null;
}

export async function listCurriculums(
  organizationId: string
): Promise<CurriculumData[]> {
  const curriculums = await prisma.customCurriculum.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });

  return curriculums.map(formatCurriculum);
}

export async function updateCurriculum(
  curriculumId: string,
  data: {
    name?: string;
    description?: string;
    status?: string;
    settings?: Record<string, unknown>;
  }
): Promise<CurriculumData> {
  const curriculum = await prisma.customCurriculum.update({
    where: { id: curriculumId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.settings !== undefined && { settings: JSON.stringify(data.settings) }),
    },
  });

  return formatCurriculum(curriculum);
}

export async function deleteCurriculum(curriculumId: string): Promise<void> {
  await prisma.customCurriculum.delete({
    where: { id: curriculumId },
  });
}

export async function addModule(data: {
  curriculumId: string;
  title: string;
  description?: string;
  order?: number;
  settings?: Record<string, unknown>;
}): Promise<ModuleData> {
  const createdModule = await prisma.customModule.create({
    data: {
      curriculumId: data.curriculumId,
      title: data.title,
      description: data.description,
      order: data.order || 0,
      settings: data.settings !== undefined ? JSON.stringify(data.settings) : "{}",
    },
  });

  return formatModule(createdModule);
}

export async function listModules(curriculumId: string): Promise<ModuleData[]> {
  const modules = await prisma.customModule.findMany({
    where: { curriculumId },
    orderBy: { order: "asc" },
  });

  return modules.map(formatModule);
}

export async function updateModule(
  moduleId: string,
  data: {
    title?: string;
    description?: string;
    order?: number;
    settings?: Record<string, unknown>;
  }
): Promise<ModuleData> {
  const updated = await prisma.customModule.update({
    where: { id: moduleId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.order !== undefined && { order: data.order }),
      ...(data.settings !== undefined && { settings: JSON.stringify(data.settings) }),
    },
  });

  return formatModule(updated);
}

export async function removeModule(moduleId: string): Promise<void> {
  await prisma.customModule.delete({
    where: { id: moduleId },
  });
}
