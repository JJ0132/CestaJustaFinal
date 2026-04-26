using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace CestaJusta.API.Models
{
    [Table("Recetas_Ingredientes")]
    public class RecetaIngrediente
    {
        [Key]
        public int Id { get; set; }

        // tipo: desayuno | comida | cena
        public string RecetaTipo { get; set; } = string.Empty;

        public int RecetaId { get; set; }

        public int IngredienteId { get; set; }

        public decimal Cantidad { get; set; } = 1m;

        [ForeignKey("IngredienteId")]
        public Ingrediente? Ingrediente { get; set; }
    }
}
