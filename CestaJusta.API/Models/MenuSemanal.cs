using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CestaJusta.API.Models
{
    [Table("Menus_Semanales")]
    public class MenuSemanal
    {
        [Key]
        [Column("ID_Menu_Semanal")]
        public int Id { get; set; }

        [Column("Precio_Semana", TypeName = "decimal(10, 2)")]
        public decimal PrecioSemana { get; set; }

        public bool EsVegetariano { get; set; }

        [Column("ID_Menu_Lunes")]
        public int LunesId { get; set; }
        [ForeignKey("LunesId")]
        public MenuDiario? Lunes { get; set; }

        [Column("ID_Menu_Martes")]
        public int MartesId { get; set; }
        [ForeignKey("MartesId")]
        public MenuDiario? Martes { get; set; }

        [Column("ID_Menu_Miercoles")]
        public int MiercolesId { get; set; }
        [ForeignKey("MiercolesId")]
        public MenuDiario? Miercoles { get; set; }

        [Column("ID_Menu_Jueves")]
        public int JuevesId { get; set; }
        [ForeignKey("JuevesId")]
        public MenuDiario? Jueves { get; set; }

        [Column("ID_Menu_Viernes")]
        public int ViernesId { get; set; }
        [ForeignKey("ViernesId")]
        public MenuDiario? Viernes { get; set; }

        [Column("ID_Menu_Sabado")]
        public int SabadoId { get; set; }
        [ForeignKey("SabadoId")]
        public MenuDiario? Sabado { get; set; }

        [Column("ID_Menu_Domingo")]
        public int DomingoId { get; set; }
        [ForeignKey("DomingoId")]
        public MenuDiario? Domingo { get; set; }
    }
}
