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

    // 5. Seed Recetas_Ingredientes (heurística)
    if (!context.RecetasIngredientes.Any() && context.Ingredientes.Any())
    {
        var allIngredients = context.Ingredientes.ToList();

        // helper to match ingredients by name tokens
        List<int> FindMatchingIngredientIds(string recipeName)
        {
            var tokens = (recipeName ?? string.Empty).ToLower().Split(new char[] {',',' ','-','/'}, StringSplitOptions.RemoveEmptyEntries).Select(t => t.Trim()).Where(t => t.Length>2).ToList();
            var matches = new List<int>();
            foreach (var ing in allIngredients)
            {
                var n = ing.Nombre.ToLower();
                foreach (var tk in tokens)
                {
                    if (n.Contains(tk)) { matches.Add(ing.Id); break; }
                }
            }
            return matches.Distinct().ToList();
        }

        // Map desayunos
        foreach(var r in context.RecetasDesayuno.ToList())
        {
            var matched = FindMatchingIngredientIds(r.Nombre);
            foreach(var id in matched) context.RecetasIngredientes.Add(new RecetaIngrediente { RecetaTipo = "desayuno", RecetaId = r.Id, IngredienteId = id, Cantidad = 1 });
        }

        // Map comidas
        foreach(var r in context.RecetasComida.ToList())
        {
            var matched = FindMatchingIngredientIds(r.Nombre);
            foreach(var id in matched) context.RecetasIngredientes.Add(new RecetaIngrediente { RecetaTipo = "comida", RecetaId = r.Id, IngredienteId = id, Cantidad = 1 });
        }

        // Map cenas
        foreach(var r in context.RecetasCena.ToList())
        {
            var matched = FindMatchingIngredientIds(r.Nombre);
            foreach(var id in matched) context.RecetasIngredientes.Add(new RecetaIngrediente { RecetaTipo = "cena", RecetaId = r.Id, IngredienteId = id, Cantidad = 1 });
        }

        context.SaveChanges();
    }

    // 6. Seed Menu_Diario (Random Generation)
    if (!context.MenuDiarios.Any() && context.RecetasDesayuno.Any() && context.RecetasComida.Any() && context.RecetasCena.Any())
    {
        var desayunos = context.RecetasDesayuno.ToList();
        var comidas = context.RecetasComida.ToList();
        var cenas = context.RecetasCena.ToList();
        
        var rnd = new Random();
        var menusGenerados = new List<MenuDiario>();

        // Generar 100 menús aleatorios
        for (int i = 0; i < 100; i++)
        {
            var desayuno = desayunos[rnd.Next(desayunos.Count)];
            var comida = comidas[rnd.Next(comidas.Count)];
            var cena = cenas[rnd.Next(cenas.Count)];

            menusGenerados.Add(new MenuDiario
            {
                DesayunoId = desayuno.Id,
                ComidaId = comida.Id,
                CenaId = cena.Id,
                PrecioTotalDia = desayuno.Precio + comida.Precio + cena.Precio,
                EsVegetariano = desayuno.EsVegetariano && comida.EsVegetariano && cena.EsVegetariano
            });
        }
        
        context.MenuDiarios.AddRange(menusGenerados);
        context.SaveChanges();
    }

    // 7. Seed Menu_Semanal (Random Generation)
    if (!context.MenuSemanales.Any() && context.MenuDiarios.Any())
    {
        var menusDiarios = context.MenuDiarios.ToList();
        var rnd = new Random();
        var semanasGeneradas = new List<MenuSemanal>();

        for (int i = 0; i < 20; i++) // Generar 20 menús semanales
        {
            var l = menusDiarios[rnd.Next(menusDiarios.Count)];
            var m = menusDiarios[rnd.Next(menusDiarios.Count)];
            var x = menusDiarios[rnd.Next(menusDiarios.Count)];
            var j = menusDiarios[rnd.Next(menusDiarios.Count)];
            var v = menusDiarios[rnd.Next(menusDiarios.Count)];
            var s = menusDiarios[rnd.Next(menusDiarios.Count)];
            var d = menusDiarios[rnd.Next(menusDiarios.Count)];

            semanasGeneradas.Add(new MenuSemanal
            {
                LunesId = l.Id,
                MartesId = m.Id,
                MiercolesId = x.Id,
                JuevesId = j.Id,
                ViernesId = v.Id,
                SabadoId = s.Id,
                DomingoId = d.Id,
                PrecioSemana = l.PrecioTotalDia + m.PrecioTotalDia + x.PrecioTotalDia + j.PrecioTotalDia + v.PrecioTotalDia + s.PrecioTotalDia + d.PrecioTotalDia,
                EsVegetariano = l.EsVegetariano && m.EsVegetariano && x.EsVegetariano && j.EsVegetariano && v.EsVegetariano && s.EsVegetariano && d.EsVegetariano
            });
        }
        
        context.MenuSemanales.AddRange(semanasGeneradas);
        context.SaveChanges();
    }
}

app.Run();
