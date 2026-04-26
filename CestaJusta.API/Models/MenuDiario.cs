using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CestaJusta.API.Models
{
    [Table("Menus_Diarios")]
    public class MenuDiario
    {
        [Key]
        [Column("ID_Menu_Diario")]
        public int Id { get; set; }

        [Column("ID_Desayuno")]
        public int DesayunoId { get; set; }

        [Column("ID_Comida")]
        public int ComidaId { get; set; }

        [Column("ID_Cena")]
        public int CenaId { get; set; }

        [Column("Precio_Total_Dia", TypeName = "decimal(10, 2)")]
        public decimal PrecioTotalDia { get; set; }

        public bool EsVegetariano { get; set; }

        // Propiedades de navegación (Relaciones)
        [ForeignKey("DesayunoId")]
        public RecetaDesayuno Desayuno { get; set; } = null!;

        [ForeignKey("ComidaId")]
        public RecetaComida Comida { get; set; } = null!;

        [ForeignKey("CenaId")]
        public RecetaCena Cena { get; set; } = null!;
    }
}
