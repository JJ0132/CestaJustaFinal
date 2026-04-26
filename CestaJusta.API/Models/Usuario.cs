using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CestaJusta.API.Models
{
    [Table("Usuario")]
    public class Usuario
    {
        [Key]
        [Column("Email")]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Nombre { get; set; } = string.Empty;

        [Required]
        public string Apellido1 { get; set; } = string.Empty;

        public string? Apellido2 { get; set; }

        [Required]
        public string NombreUsuario { get; set; } = string.Empty;

        [Required]
        public string ContrasenaHash { get; set; } = string.Empty;

        public string? Telefono { get; set; }

        [Column("Fecha_Creacion")]
        public DateTime FechaCreacion { get; set; }

        public bool Premium { get; set; }
    }
}
