import express, { Request, Response, NextFunction } from "express";
import { createDepartment, deleteDepartment, getDepartment, listDepartments, updateDepartment } from "../lib/departments.js";
import { listCourses, createCourse, updateCourse, deleteCourse } from "../lib/courses.js";
import { Department, Course } from "../src/types.js";

export const router = express.Router();

export async function index(req: Request, res: Response, next: NextFunction) {
  return res.json([
    {
      href: "/departments",
      methods: ["GET", "POST"],
    },
    {
      href: "/departments/:slug",
      methods: ["GET", "PATCH", "DELETE"],
    },
    {
      href: "/departments/:slug/courses",
      methods: ["GET", "POST"],
    },
    {
      href: "/departments/:slug/courses/:courseId",
      methods: ["GET", "PATCH", "DELETE"],
    },
  ]);
}

// Departments
router.get("/", index); // [200]DONE
router.get("/departments", async (req: Request, res: Response) => {
  try {
    const departments: Department[] = await listDepartments();
    return res.status(200).json(departments);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
});

router.post("/departments", async (req: Request, res: Response) => {
  const { title, slug, description } = req.body;
  if (!title || !slug || !description) {
    return res.status(400).send("Missing required fields");
  }
  try {
    const newDepartment: Department = await createDepartment(title, slug, description);
    return res.status(200).json(newDepartment);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
});

router.get('/departments/:slug/courses', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const courses = await listCourses(req, res, next);
    return res.json(courses);
  } catch (err) {
    next(err);
  }
});

router.get("/departments/:slug", async (req: Request, res: Response) => {
  const { slug } = req.params;
  try {
    const department: Department = await getDepartment(slug);
    if (!department) {
      return res.status(404).send("Department not found");
    }
    return res.status(200).json(department);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
});

router.patch("/departments/:slug", async (req: Request, res: Response) => {
  const { slug } = req.params;
  const { title, description } = req.body;
  if (!title || !description) {
    return res.status(400).send("Missing required fields");
  }
  try {
    const updatedDepartment: Department = await updateDepartment(slug, title, description);
    if (!updatedDepartment) {
      return res.status(404).send("Department not found");
    }
    return res.status(200).json(updatedDepartment);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
});

router.delete("/departments/:slug", async (req: Request, res: Response) => {
  const { slug } = req.params;
  try {
    const deletedDepartment: Department = await deleteDepartment(slug);
    if (!deletedDepartment) {
      return res.status(404).send("Department not found");
    }
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal ServerError");
  }
});

router.post("/departments/:slug/courses", async (req: Request, res: Response) => {
  const { slug } = req.params;
  const { title, description } = req.body;
  if (!title || !description) {
    return res.status(400).send("Missing required fields");
  }
  try {
    const newCourse: Course = await createCourse(slug, title, description);
    return res.status(200).json(newCourse);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
});

router.get("/departments/:slug/courses/:courseId", async (req: Request, res: Response) => {
  const { slug, courseId } = req.params;
  try {
    const course: Course = await getCourse(slug, courseId);
    if (!course) {
      return res.status(404).send("Course not found");
    }
    return res.status(200).json(course);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
});

router.patch("/departments/:slug/courses/:courseId", async (req: Request, res: Response) => {
  const { slug, courseId } = req.params;
  const { title, description } = req.body;
  if (!title || !description) {
    return res.status(400).send("Missing required fields");
  }
  try {
    const updatedCourse: Course = await updateCourse(slug, courseId, title, description);
    if (!updatedCourse) {
      return res.status(404).send("Course not found");
    }
    return res.status(200).json(updatedCourse);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
});

router.delete("/departments/:slug/courses/:courseId", async (req: Request, res: Response) => {
  const { slug, courseId } = req.params;
  try {
    const deletedCourse: Course = await deleteCourse(slug, courseId);
    if (!deletedCourse) {
      return res.status(404).send("Course not found");
    }
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
});

export default router;
