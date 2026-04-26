using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace CestaJusta.API.Models
{
    [Table("Recetas_Comida")]
    public class RecetaComida
    {
        [Key]
        [JsonPropertyName("IdComida")]
        public int Id { get; set; }

        [Required]
        [JsonPropertyName("NombreComida")]
        public string Nombre { get; set; } = string.Empty;

        [JsonPropertyName("Precio_Comida")]
        public decimal Precio { get; set; }

        public bool EsVegetariano { get; set; }
    }
}
