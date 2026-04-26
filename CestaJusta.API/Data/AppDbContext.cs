using Microsoft.EntityFrameworkCore;
using CestaJusta.API.Models;

namespace CestaJusta.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<RecetaDesayuno> RecetasDesayuno { get; set; }
        public DbSet<RecetaComida> RecetasComida { get; set; }
        public DbSet<RecetaCena> RecetasCena { get; set; }
        public DbSet<MenuDiario> MenuDiarios { get; set; }
        public DbSet<MenuSemanal> MenuSemanales { get; set; }
        public DbSet<Ingrediente> Ingredientes { get; set; }
        public DbSet<RecetaIngrediente> RecetasIngredientes { get; set; }
    }
}
