using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using CestaJusta.API.Data;
using CestaJusta.API.Models;

var builder = WebApplication.CreateBuilder(args);

// Add SQLite DbContext
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=cestajusta.db"));

builder.Services.AddControllers();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

bool IsVegetarian(string name)
{
    var lower = name.ToLower();
    string[] meats = { "pollo", "pavo", "cerdo", "ternera", "jamón", "jamon", "atún", "atun", "merluza", "salmón", "pescado", "carne", "mejillones", "pota", "calamar", "lomo", "salchicha", "chorizo", "bacon", "panceta", "melva", "choped", "salami", "lomo", "bacalao" };
    foreach (var m in meats) if (lower.Contains(m)) return false;
    return true;
}

// Ensure DB is created and Seed Data
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    context.Database.EnsureCreated();
    context.Database.ExecuteSqlRaw("""
        CREATE TABLE IF NOT EXISTS "Usuario" (
            "Email" TEXT NOT NULL PRIMARY KEY,
            "Nombre" TEXT NOT NULL,
            "Apellido1" TEXT NOT NULL,
            "Apellido2" TEXT NULL,
            "NombreUsuario" TEXT NOT NULL,
            "ContrasenaHash" TEXT NOT NULL,
            "Telefono" TEXT NULL,
            "Fecha_Creacion" TEXT NOT NULL,
            "Premium" INTEGER NOT NULL DEFAULT 0
        );
        """);
    context.Database.ExecuteSqlRaw("""
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_Usuario_NombreUsuario"
        ON "Usuario" ("NombreUsuario");
        """);
    context.Database.ExecuteSqlRaw("""
        CREATE TABLE IF NOT EXISTS "Tracking" (
            "Id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            "UsuarioEmail" TEXT NOT NULL,
            "Fecha" TEXT NOT NULL,
            "GastoDiario" REAL NOT NULL,
            "GastoSemanal" REAL NOT NULL,
            "GastoMensual" REAL NOT NULL,
            "MenuDiarioId" INTEGER NULL,
            "MenuSemanalId" INTEGER NULL,
            CONSTRAINT "FK_Tracking_Usuario_UsuarioEmail"
                FOREIGN KEY ("UsuarioEmail") REFERENCES "Usuario" ("Email")
                ON DELETE CASCADE
        );
        """);

    var dbFolderPath = Path.Combine(Directory.GetParent(builder.Environment.ContentRootPath)!.FullName, "DB");

    // 1. Seed Recetas_Desayuno
    if (!context.RecetasDesayuno.Any())
    {
        var jsonPath = Path.Combine(dbFolderPath, "recetas_Desayuno.json");
        if (File.Exists(jsonPath))
        {
            var jsonContent = File.ReadAllText(jsonPath);
            var recetas = JsonSerializer.Deserialize<List<RecetaDesayuno>>(jsonContent);
            if (recetas != null && recetas.Any())
            {
                foreach(var r in recetas) r.EsVegetariano = IsVegetarian(r.Nombre);
                context.RecetasDesayuno.AddRange(recetas);
            }
        }
    }

    // 2. Seed Recetas_Comida
    if (!context.RecetasComida.Any())
    {
        var jsonPath = Path.Combine(dbFolderPath, "recetas_Comida.json");
        if (File.Exists(jsonPath))
        {
            var jsonContent = File.ReadAllText(jsonPath);
            var recetas = JsonSerializer.Deserialize<List<RecetaComida>>(jsonContent);
            if (recetas != null && recetas.Any())
            {
                foreach(var r in recetas) r.EsVegetariano = IsVegetarian(r.Nombre);
                context.RecetasComida.AddRange(recetas);
            }
        }
    }

    // 3. Seed Recetas_Cena
    if (!context.RecetasCena.Any())
    {
        var jsonPath = Path.Combine(dbFolderPath, "recetas_Cena.json");
        if (File.Exists(jsonPath))
        {
            var jsonContent = File.ReadAllText(jsonPath);
            var recetas = JsonSerializer.Deserialize<List<RecetaCena>>(jsonContent);
            if (recetas != null && recetas.Any())
            {
                foreach(var r in recetas) r.EsVegetariano = IsVegetarian(r.Nombre);
                context.RecetasCena.AddRange(recetas);
            }
        }
    }

    context.SaveChanges();

    // 4. Seed Ingredientes
    if (!context.Ingredientes.Any())
    {
        var ingredientesPath = Path.Combine(dbFolderPath, "ingredientes.json");
        if (File.Exists(ingredientesPath))
        {
            var jsonIng = File.ReadAllText(ingredientesPath);
            try
            {
                var ings = JsonSerializer.Deserialize<List<Ingrediente>>(jsonIng);
                if (ings != null && ings.Any())
                {
                    context.Ingredientes.AddRange(ings);
                    context.SaveChanges();
                }
            }
            catch
            {
                // ignore malformed
            }
        }
    }

    // Set Jaigeen as premium user for testing
    context.Database.ExecuteSqlRaw(
        "UPDATE Usuario SET Premium = 1 WHERE NombreUsuario = 'Jaigeen';");
}

app.Run();
