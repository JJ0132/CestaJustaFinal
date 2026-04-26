using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CestaJusta.API.Models
{
    [Table("Tracking")]
    public class TrackingRegistro
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string UsuarioEmail { get; set; } = string.Empty;

        public DateTime Fecha { get; set; }

        [Column(TypeName = "decimal(10, 2)")]
        public decimal GastoDiario { get; set; }

        [Column(TypeName = "decimal(10, 2)")]
        public decimal GastoSemanal { get; set; }

        [Column(TypeName = "decimal(10, 2)")]
        public decimal GastoMensual { get; set; }

        public int? MenuDiarioId { get; set; }

        public int? MenuSemanalId { get; set; }

        [ForeignKey("UsuarioEmail")]
        public Usuario Usuario { get; set; } = null!;
    }
}
