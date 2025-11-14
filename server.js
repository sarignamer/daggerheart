import express from "express";
import fs from "fs";
import path from "path";

const app = express();
app.use(express.json());

// Serve static files
app.use(express.static(path.join(process.cwd(), "public")));

// ====== API: List card images ======
function scanCardFolders(dirPath, baseUrl) {
  const result = {};
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const entryUrl = `${baseUrl}/${entry.name}`;

    if (entry.isDirectory()) {
      // Recursive scan
      const sub = scanCardFolders(fullPath, entryUrl);

      // Only add directories that contain something
      if (Object.keys(sub).length > 0) {
        result[entry.name] = sub;
      }

    } else if (entry.isFile() && entry.name.match(/\.(png|jpg|jpeg|webp)$/i)) {
      // Collect actual image files
      if (!result["_files"]) result["_files"] = [];
      result["_files"].push(entryUrl);
    }
  }

  return result;
}

  
app.get("/api/cards", (req, res) => {
  const cardsDir = path.join(process.cwd(), "public/cards");
  const structure = scanCardFolders(cardsDir, "/cards");
  res.json(structure);
}); 

// ====== API: List saved characters ======
app.get("/api/characters", (req, res) => {
  const dir = path.join(process.cwd(), "data/characters");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);

  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith(".json"))
    .map(f => f.replace(".json", ""));

  res.json(files);
});

// ====== API: Load a character ======
app.get("/api/character/:name", (req, res) => {
  const file = path.join(process.cwd(), "data/characters", req.params.name + ".json");

  if (!fs.existsSync(file)) {
    return res.status(404).json({ error: "Character not found" });
  }

  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  res.json(data);
});

// ====== API: Save character ======
app.post("/api/character/save", (req, res) => {
  const character = req.body;

  if (!character.name) {
    return res.status(400).json({ error: "Character must have a name" });
  }

  const file = path.join(process.cwd(), "data/characters", character.name + ".json");
  fs.writeFileSync(file, JSON.stringify(character, null, 2));

  res.json({ ok: true });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(process.cwd(), "views/index.html"));
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
