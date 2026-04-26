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
        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<TrackingRegistro> TrackingRegistros { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Usuario>()
                .HasIndex(u => u.NombreUsuario)
                .IsUnique();

            modelBuilder.Entity<TrackingRegistro>()
                .HasOne(t => t.Usuario)
                .WithMany()
                .HasForeignKey(t => t.UsuarioEmail)
                .HasPrincipalKey(u => u.Email);
        }
    }
}
